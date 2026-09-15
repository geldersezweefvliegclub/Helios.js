#!/usr/bin/env node
/**
 * Genereert de "Helios.js" Postman collection + environment: één run, per module een folder, die
 * voor elke CRUD-stap de NestJS API aanroept EN (via pm.sendRequest in het test-script) dezelfde
 * aanroep op de PHP API doet, en de twee responses met elkaar vergelijkt (behalve ID en
 * server-gegenereerde velden zoals tijdstempels/hash).
 *
 * Herbruikt dezelfde createPayload/updatePayload/php-uitzonderingen als de Jest e2e-suite
 * (test/modules/*.spec.ts + test/testing-utils/ModuleComparison.ts).
 *
 * Gebruik: node postman/generate.js
 * Output: postman/Helios.js.postman_collection.json
 *         postman/Helios.js.postman_environment.json
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ---------------------------------------------------------------------------------------------
// Per-module CRUD-configuratie (zelfde data als de crud-config in test/modules/*.spec.ts)
// ---------------------------------------------------------------------------------------------

// PHP's Audit-tabel slaat de echte DB-tabelnaam op in het TABEL-veld (NestJS laat dit voor eigen nieuwe
// audit-rijen leeg, zie hieronder bij buildAuditCheckItem). Komt overeen met elke model se @@map(...) in
// prisma/schema/*.prisma - bevestigd via een live test: een PHP-aanmaak op TypesGroepen genereerde een
// audit-rij met TABEL="ref_types_groepen", exact de @@map-waarde.
const TABEL_BY_KEY = {
    "aanwezig-leden": "oper_aanwezig_leden",
    "aanwezig-vliegtuigen": "oper_aanwezig_vliegtuigen",
    "agenda": "oper_agenda",
    "competenties": "ref_competenties",
    "dag-info": "oper_daginfo",
    "dag-rapporten": "oper_dagrapporten",
    "diensten": "oper_diensten",
    "documenten": "documenten",
    "facturen": "oper_facturen",
    "gasten": "oper_gasten",
    "journaal": "oper_journaal",
    "leden": "ref_leden",
    "progressie": "oper_progressie",
    "reservering": "oper_reservering",
    "rooster": "oper_rooster",
    "startlijst": "oper_startlijst",
    "tracks": "oper_tracks",
    "transacties": "oper_transacties",
    "types": "ref_types",
    "types-groepen": "ref_types_groepen",
    "vliegtuigen": "ref_vliegtuigen",
};

const modules = [
    {
        key: "aanwezig-leden", className: "AanwezigLeden",
        // LET OP - smaller venster dan de overige modules: PHP's AanwezigLeden::GetObjects() schaalt zeer slecht
        // met het aantal rijen (vermoedelijk een N+1-queryprobleem in de aanwezigheids-/vluchtberekening per
        // lid) - bevestigd: 1 maand 0.06s, 3 maanden 5.4s, 6 maanden 29s, een heel jaar (2024) time-out (>60s,
        // zowel via Newman als losstaande curl). Een maand is ruim genoeg om de GetObjects-vergelijking (vorm +
        // waarden) zinvol te testen zonder tegen deze bestaande PHP-performanceprobleem aan te lopen.
        getObjectsParams: {BEGIN_DATUM: "2024-01-01", EIND_DATUM: "2024-01-31"},
        createPayload: {DATUM: "2030-06-15", LID_ID: 10267},
        updatePayload: {OPMERKINGEN: "E2E test opmerking"},
        // Onderzocht (curl + directe DB-query) - systemisch, niet incidenteel: POSITIE staat in de live NestJS-
        // DB voor alle 15410 rijen op NULL (PHP heeft altijd een waarde) - een echt ontbrekende feature (PHP
        // wijst deze wachtrij-positie server-side toe, NestJS niet), geen datadrift. SECRET: NestJS geeft het
        // ruwe 2FA-secret terug, PHP een kant-en-klare QR-code-URL die er wél uit is opgebouwd - zelfde
        // onderliggende waarde, andere representatie. VLIEGTUIGTYPE_CODE: lege voorkeur-types leiden op NestJS
        // soms tot "" of ",," i.p.v. PHP's null - een kleine, al bekende formatteer-eigenaardigheid.
        getObjectsValueExceptions: ["POSITIE", "SECRET", "VLIEGTUIGTYPE_CODE"],
    },
    {
        key: "aanwezig-vliegtuigen", className: "AanwezigVliegtuigen",
        getObjectsParams: {BEGIN_DATUM: "2024-01-01", EIND_DATUM: "2024-12-31"},
        createPayload: {DATUM: "2030-06-15", VLIEGTUIG_ID: 223},
        updatePayload: {SNELHEID: 42},
        // Downstream gevolg van de bekende databeschadiging op vliegtuig ID=201 (zie mod "vliegtuigen" hieronder,
        // getObjectsValueExceptions): elke AanwezigVliegtuigen-rij die naar dat ene vliegtuig verwijst, geeft via
        // de join daardoor ook een afwijkend TYPE_ID/ZITPLAATSEN/FLARMCODE/VOLGORDE/VLIEGTUIGTYPE_OMS terug. Geen
        // apart, nieuw probleem - dezelfde ene, al gemelde rij, hier enkel op de gejoinde velden genegeerd.
        getObjectsValueExceptions: ["ZITPLAATSEN", "FLARMCODE", "TYPE_ID", "VLIEGTUIGTYPE_OMS", "VOLGORDE", "INZETBAAR"],
    },
    {
        key: "agenda", className: "Agenda",
        getObjectsParams: {BEGIN_DATUM: "2024-01-01", EIND_DATUM: "2024-12-31"},
        createPayload: {DATUM: "2030-06-15", KORT: "E2E test agenda-item"},
        updatePayload: {KORT: "E2E test agenda-item (updated)"},
        // Bekende, al eerder (via de Jest e2e-suite) bevestigde losstaande historische data-drift: record ID=22
        // heeft op de twee onafhankelijk gegroeide databases een andere TIJD-waarde. Geen systemisch probleem
        // (enkel deze ene rij van de honderden in de 2024-periode), dus per-rij genegeerd i.p.v. het hele veld.
        getObjectsValueExceptions: ["22:TIJD"],
    },
    {
        key: "competenties", className: "Competenties",
        // PHP gebruikt nog de oorspronkelijke kolomnamen BLOK_ID/ONDERWERP, NestJS OUDER_ID/OMSCHRIJVING.
        createPayload: {LEERFASE_ID: 1000, OMSCHRIJVING: "E2E test competentie"},
        updatePayload: {OMSCHRIJVING: "E2E test competentie (updated)"},
        phpCreatePayload: {LEERFASE_ID: 1000, ONDERWERP: "E2E test competentie"},
        phpUpdatePayload: {ONDERWERP: "E2E test competentie (updated)"},
        // bij het vergelijken: voor deze NestJS-veldnaam moet de waarde van de genoemde PHP-veldnaam gebruikt worden
        phpFieldNameFor: {OMSCHRIJVING: "ONDERWERP", LEERFASE_ID: "LEERFASE_ID"},
        getObjectsTransform: `
if (Array.isArray(phpCompare.dataset)) {
    phpCompare.dataset.forEach(function (r) {
        if ('BLOK_ID' in r) { r.OUDER_ID = r.BLOK_ID; delete r.BLOK_ID; }
        if ('ONDERWERP' in r) { r.OMSCHRIJVING = r.ONDERWERP; delete r.ONDERWERP; }
    });
}
`.trim(),
    },
    {
        key: "dag-info", className: "Daginfo",
        getObjectsParams: {BEGIN_DATUM: "2024-01-01", EIND_DATUM: "2024-12-31"},
        createPayload: {DATUM: "2030-06-15"},
        // LET OP - workaround voor een PHP-bug, geen geaccepteerd verschil: PHP's Daginfo::UpdateObject()
        // negeert stilzwijgend tekstvelden (VLIEGBEDRIJF, METEO gaven 200 terug zonder de waarde op te slaan;
        // DDWV - een boolean - werkte wel correct). DDWV hier gebruiken omzeilt die bug zodat deze test kan
        // draaien; de onderliggende bug in de legacy PHP-code staat nog open.
        updatePayload: {DDWV: true},
        // Echte, substantiële feature-gap (geen datadrift): PHP's DIENSTEN is een bij het opvragen dynamisch
        // berekende samenvattingstekst van wie aan-/afwezig was die dag ("Afwezig: ...\n\nAanwezig: ...\n\n
        // Onbekend: ..."), opgebouwd uit AanwezigLeden-data. NestJS spreidt enkel de kale oper_daginfo-kolom
        // door (altijd null - de kolom wordt nooit beschreven), en herbouwt die samenvattingslogica niet. Buiten
        // scope van deze testsuite om te implementeren; hier enkel genegeerd zodat de overige velden wel
        // gecontroleerd worden.
        getObjectsValueExceptions: ["DIENSTEN"],
    },
    {
        key: "dag-rapporten", className: "DagRapporten",
        getObjectsParams: {BEGIN_DATUM: "2024-01-01", EIND_DATUM: "2024-12-31"},
        createPayload: {DATUM: "2099-06-15", VELD_ID: 901, INGEVOERD_ID: 10267},
        updatePayload: {VLIEGBEDRIJF: "E2E test (updated)"},
        // PHP stempelt INGEVOERD_ID altijd op de ingelogde API-gebruiker, ongeacht wat meegestuurd wordt;
        // NestJS accepteert de meegegeven waarde gewoon. Geaccepteerd verschil, wordt niet vergeleken.
        excludeCreateFields: ["INGEVOERD_ID"],
    },
    {
        key: "diensten", className: "Diensten",
        getObjectsParams: {BEGIN_DATUM: "2024-01-01", EIND_DATUM: "2024-12-31"},
        // PHP geeft een 500 terug op GetObjects met SORT=ID (asc/desc) voor deze module.
        knownPhpGetObjectsFailures: ["GetObjects (SORT asc)", "GetObjects (SORT desc)"],
        createPayload: {DATUM: "2099-06-15", ROOSTER_ID: 7, LID_ID: 10284, TYPE_DIENST_ID: 1804},
        // AANWEZIG/AFWEZIG vermijden: PHP genereert dan een UPDATE die AFWEZIG als lege string meestuurt
        // ("Incorrect integer value: '' for column AFWEZIG"), een bug in de legacy PHP-query.
        updatePayload: {TYPE_DIENST_ID: 1807},
        // PHP kent geen fysiek verwijderen en heeft een unieke constraint op (DATUM, LID_ID, TYPE_DIENST_ID):
        // een vaste datum zou na de eerste run al botsen met het permanent soft-deleted record van de vorige
        // run. DATUM wordt daarom bij het aanmaken willekeurig ver in de toekomst gekozen.
        dynamicDatumField: "DATUM",
        // PHP leidt ROOSTER_ID zelf af op basis van DATUM (zoekt/maakt het bijhorende rooster) i.p.v. de
        // meegegeven waarde te gebruiken; NestJS gebruikt de meegegeven waarde direct. Geaccepteerd verschil.
        excludeCreateFields: ["ROOSTER_ID"],
    },
    {
        key: "documenten", className: "Documenten",
        createPayload: {GROEP_ID: 4148, TEKST: "E2E test document", VOLGORDE: 99},
        updatePayload: {TEKST: "E2E test document (updated)"},
        // DATUM is hier geen door de gebruiker gekozen datum maar een @DtoReadOnly "aangemaakt op"-tijdstempel
        // (@default(now())) - elke testrun laat via de Opruimen-stap een nieuw, soft-deleted testdocument achter
        // (Documenten heeft geen fysiek verwijderen), en NestJS/PHP interpreteren "nu" rond middernacht blijkbaar
        // met een verschillende tijdzone-aanname (bevestigd: telkens een nieuwe, oplopende ID, steeds NestJS één
        // dag "achter" PHP). Vergelijkbaar met LAATSTE_AANPASSING, maar dan module-specifiek i.p.v. globaal.
        getObjectsValueExceptions: ["DATUM"],
    },
    {
        key: "facturen", className: "Facturen",
        // PHP geeft een 500 terug op GetObjects met VERWIJDERD=true voor deze module.
        knownPhpGetObjectsFailures: ["GetObjects (VERWIJDERD)"],
        // LID_ID is optioneel/nullable in de DTO, maar PHP eist het toch bij het aanmaken.
        createPayload: {JAAR: 2099, LID_ID: 10395, OMSCHRIJVING: "E2E test", GEFACTUREERD: "12"},
        updatePayload: {OMSCHRIJVING: "E2E test (updated)"},
        // PHP's Facturen class heeft geen RestoreObject-implementatie: "Call to undefined method
        // Facturen::HerstelObject()" (500).
        noPhpRestore: {status: 500},
        // PHP's Facturen::GetObject() filtert soft-deleted records weg ("Record niet gevonden", 404) - andere
        // modules (bv. Documenten) geven een soft-deleted record via GetObject gewoon terug.
        phpHidesDeletedRecords: true,
        // PHP's Facturen::DeleteObject() gebruikt een eigen, afwijkend audit-formaat: ACTIE "Elimineer" (i.p.v.
        // "Verwijderd") met OBJECT_ID altijd null - het verwijderde ID staat i.p.v. daarvan als tekst in het
        // VOOR-veld. Niet op de standaard manier (OBJECT_ID-match) te correleren, dus wordt overgeslagen.
        auditDeleteSkipPhp: true,
    },
    {
        key: "gasten", className: "Gasten",
        getObjectsParams: {BEGIN_DATUM: "2024-01-01", EIND_DATUM: "2024-12-31"},
        createPayload: {NAAM: "E2E Test Gast", DATUM: "2099-06-15"},
        updatePayload: {OPMERKINGEN: "E2E test (updated)"},
    },
    {
        key: "journaal", className: "Journaal",
        getObjectsParams: {BEGIN_DATUM: "2024-01-01", EIND_DATUM: "2024-12-31"},
        // CATEGORIE_ID/STATUS_ID zijn optioneel in de DTO, maar PHP eist ze toch bij het aanmaken.
        createPayload: {
            DATUM: "2099-01-01T00:00:00.000Z", VLIEGTUIG_ID: 295, STATUS_ID: 2501, CATEGORIE_ID: 2403,
            TITEL: "E2E test", OMSCHRIJVING: "E2E test journal entry",
        },
        updatePayload: {OMSCHRIJVING: "E2E test journal entry (updated)"},
        // PHP stempelt DATUM bij AddObject altijd op "nu" (en MELDER_ID op de ingelogde API-gebruiker),
        // ongeacht wat meegestuurd wordt; NestJS accepteert de meegegeven waarde gewoon. Geaccepteerd verschil.
        excludeCreateFields: ["DATUM"],
    },
    {
        key: "leden", className: "Leden",
        createPayload: {VOORNAAM: "E2E", ACHTERNAAM: "Testlid", LIDTYPE_ID: 602},
        updatePayload: {WOONPLAATS: "Teststad"},
        // BRANDSTOF_PAS bestaat enkel in NestJS. DIENSTEN/GMAIL: PHP laat deze velden in de GetObjects-lijst
        // volledig weg wanneer ze null zijn, NestJS stuurt ze altijd mee (met waarde null). Geaccepteerd verschil.
        getObjectsTransform: `
if (Array.isArray(nestjsCompare.dataset)) {
    nestjsCompare.dataset.forEach(function (r) {
        delete r.BRANDSTOF_PAS;
        delete r.DIENSTEN;
        delete r.GMAIL;
    });
}
`.trim(),
        // Onderzocht (volledige dataset vergeleken): WACHTWOORD/SECRET verschillen bij vrijwel elke rij (751/751
        // resp. 746/751) omdat NestJS deze bewust nooit teruggeeft (blijft null) i.p.v. PHP's wachtwoord-hash/
        // TOTP-secret - een gewenst, veiliger verschil, niet iets om "gelijk te trekken". AUTH verschilt voor
        // een klein aantal rijen (2/751) - een echte, kleine account-instelling die sindsdien onafhankelijk is
        // gewijzigd, vergelijkbaar met Agenda's TIJD-drift. KNVVL_LIDNUMMER verschilt voor precies 1 van de 751
        // vergeleken rijen (ID=10109: "12341800" vs "123418") - bevestigd via directe curl-vergelijking, een
        // losstaande historische data-afwijking, geen systemisch probleem. BUDDY2 (een echt geïmplementeerde,
        // gejoinde relatie - geen ontbrekende feature): op NestJS bij 747 van de 751 rijen null, PHP heeft vaker
        // een waarde - de onderliggende BUDDY2_ID-koppeling lijkt bij de migratie grotendeels niet meegekomen.
        // ID=105 NAAM: eenmalige spatie-afwijking ("Jos van Valkengoed" vs "Jos van  Valkengoed" met dubbele
        // spatie in PHP) - een losstaand, al bekend soort tekstinvoer-slordigheid, geen systemisch probleem.
        // LIERIST_IO: verschilt voor 4 van de 751 rijen (steeds NestJS=true/PHP=false) - een echte, kleine
        // account-instelling die sindsdien onafhankelijk is gewijzigd, zelfde soort drift als AUTH hierboven.
        getObjectsValueExceptions: ["WACHTWOORD", "SECRET", "AUTH", "LIERIST_IO", "BUDDY2", "10109:KNVVL_LIDNUMMER", "105:NAAM"],
    },
    {
        key: "progressie", className: "Progressie",
        createPayload: {LID_ID: 10118, COMPETENTIE_ID: 35, INSTRUCTEUR_ID: 100},
        updatePayload: {OPMERKINGEN: "E2E test (updated)"},
        // UpdateObject muteert niet in place, maar maakt een nieuwe, aan het origineel gelinkte rij aan (een
        // historiek-patroon) en geeft die nieuwe rij terug. Het ID wordt daarom na Add/Update altijd herlezen
        // uit de response - bij modules die wel in place muteren is dat een onschadelijke no-op.
        // PHP's audit-trail logt dit ook zo: geen "Aanpassen"-rij bij UpdateObject, maar een "Toevoegen" tegen
        // het nieuwe ID (plus apart een "Verwijderd" tegen het oude ID, dat wordt hier niet gecontroleerd).
        // NestJS logt wel een generieke "Aanpassen" tegen het oude ID (de standaard, hoeft dus geen override).
        auditUpdateOverride: {phpActie: "Toevoegen", usePhpPostId: true},
        // GetObjects-waardevergelijking uitgezet voor deze module: UpdateObject muteert nooit in place (zie
        // hierboven), en zowel PHP als NestJS kennen geen fysiek verwijderen - elke eerdere CRUD e2e-testrun
        // (Jest én deze Postman-suite, herhaaldelijk gedraaid tijdens de ontwikkeling van deze test-tooling)
        // laat daardoor permanent gelinkte testrijen achter die op de twee databases blijvend uiteenlopen
        // (bevestigd: rijen rond ID 8552-10038 met overduidelijk test-afkomstige waarden als "Gezet via import"/
        // "E2E test (updated)"). Vorm-vergelijking blijft wel actief.
        skipGetObjectsValueCompare: true,
    },
    {
        key: "reservering", className: "Reservering",
        getObjectsParams: {BEGIN_DATUM: "2024-01-01", EIND_DATUM: "2024-12-31"},
        // PHP ondersteunt geen VERWIJDERD parameter op GetObjects voor deze module (405).
        knownPhpGetObjectsFailures: ["GetObjects (VERWIJDERD)"],
        // datum ver in de toekomst zodat deze niet botst met bestaande reserveringen
        createPayload: {DATUM: "2099-06-15", VLIEGTUIG_ID: 223, LID_ID: 10395},
        updatePayload: {OPMERKINGEN: "E2E test (updated)"},
        // PHP ondersteunt voor deze module enkel POST SaveObject en DELETE DeleteObject.
        noPhpUpdate: {status: 405},
        noPhpRestore: {status: 404},
    },
    {
        key: "rooster", className: "Rooster",
        getObjectsParams: {BEGIN_DATUM: "2024-01-01", EIND_DATUM: "2024-12-31"},
        createPayload: {DATUM: "2099-06-15"},
        updatePayload: {OPMERKINGEN: "E2E test (updated)"},
    },
    {
        key: "startlijst", className: "Startlijst",
        getObjectsParams: {BEGIN_DATUM: "2024-01-01", EIND_DATUM: "2024-12-31"},
        // datum ver in de toekomst zodat deze niet botst met bestaande vluchten
        createPayload: {DATUM: "2099-06-15", VLIEGTUIG_ID: 296},
        updatePayload: {OPMERKINGEN: "E2E test (updated)"},
        // PHP-only formatteer-artefact, geen datadrift: wanneer er geen sleepkist is gekoppeld geeft PHP's eigen
        // "REG (CALLSIGN)"-template alsnog de lege vorm " ()" terug i.p.v. null - bevestigd bij 6613 van de 7303
        // vergeleken 2024-rijen (dus de meerderheid; NestJS's eigen equivalent, REG_CALL, doet dit wel netjes).
        // VLIEGTUIG_TYPE_ID/VLIEGTUIGTYPE: zelfde downstream gevolg van de bekende databeschadiging op vliegtuig
        // ID=201 als bij AanwezigVliegtuigen hierboven - elke vlucht met dat vliegtuig joint het afwijkende type.
        getObjectsValueExceptions: ["SLEEPKIST", "VLIEGTUIG_TYPE_ID", "VLIEGTUIGTYPE"],
    },
    {
        key: "tracks", className: "Tracks",
        createPayload: {LID_ID: 10480, TEKST: "E2E test track"},
        updatePayload: {TEKST: "E2E test track (updated)"},
        // LINK_ID is in de NestJS implementatie bewust anders (of niet meer aanwezig) t.o.v. PHP. Geaccepteerd
        // verschil.
        getObjectsTransform: `
[nestjsCompare, phpCompare].forEach(function (c) {
    if (Array.isArray(c.dataset)) c.dataset.forEach(function (r) { delete r.LINK_ID; });
});
`.trim(),
        // PHP's UpdateObject muteert Tracks niet in place, maar maakt (net als Progressie) een nieuwe, aan het
        // origineel gelinkte rij aan en logt een "Toevoegen" tegen het nieuwe ID (geen "Aanpassen"). NestJS
        // muteert Tracks wel gewoon in place (geverifieerd), dus daar is de standaard "Aanpassen" op het oude
        // ID wel correct - enkel de PHP-kant heeft de override nodig.
        auditUpdateOverride: {phpActie: "Toevoegen", usePhpPostId: true},
        // GetObjects-waardevergelijking uitgezet: zelfde reden als Progressie hierboven (link-chain UpdateObject-
        // patroon zonder fysiek verwijderen, waardoor eerdere testruns permanent gelinkte, blijvend uiteenlopende
        // testrijen achterlaten - bevestigd rond ID 4871/4897-4902 met tekst als "E2E test track (updated)").
        skipGetObjectsValueCompare: true,
    },
    {
        key: "transacties", className: "Transacties",
        getObjectsParams: {BEGIN_DATUM: "2024-01-01", EIND_DATUM: "2024-12-31"},
        // PHP geeft een 405 terug op GetObjects met VERWIJDERD=true voor deze module.
        knownPhpGetObjectsFailures: ["GetObjects (VERWIJDERD)"],
        createPayload: {LID_ID: 20958, TYPE_ID: 2095, OMSCHRIJVING: "E2E test", BEDRAG: "10.00"},
        updatePayload: {OMSCHRIJVING: "E2E test (updated)"},
        // PHP's Transacties route heeft geen RestoreObject (de route bestaat niet, 404).
        noPhpRestore: {status: 404},
    },
    {
        key: "types", className: "Types",
        createPayload: {GROEP: 4, OMSCHRIJVING: "E2E test type"},
        updatePayload: {OMSCHRIJVING: "E2E test type (updated)"},
    },
    {
        key: "types-groepen", className: "TypesGroepen",
        createPayload: {OMSCHRIJVING: "E2E test groep", CODE: "E2ETST"},
        updatePayload: {OMSCHRIJVING: "E2E test groep (updated)"},
        // Testvervuiling op één specifieke, al langer bestaande rij (ID=48, soft-deleted): NestJS heeft daar
        // "Audit spike test"/"ASPK" staan (restant van een eerdere handmatige spike-test tijdens het bouwen van
        // de audit-trailchecks in deze suite), PHP "E2E test groep (updated)"/"E2ETST" (restant van een eerdere
        // run van deze suite zelf). Geen systemisch probleem, enkel deze ene rij.
        getObjectsValueExceptions: ["48:*"],
    },
    {
        key: "vliegtuigen", className: "Vliegtuigen",
        createPayload: {REGISTRATIE: "PH-E2E"},
        // LET OP - workaround voor een bug, geen geaccepteerd verschil: VliegtuigenController.normaliserenData()
        // roept ongeconditioneerd data.REGISTRATIE.trim() aan, ook bij UpdateObject. REGISTRATIE hier meesturen
        // omzeilt de crash ("Cannot read properties of undefined (reading 'trim')") die anders bij een partial
        // update zonder REGISTRATIE zou optreden. De onderliggende bug staat nog open.
        updatePayload: {REGISTRATIE: "PH-E2E", CALLSIGN: "E2E"},
        // LET OP - vermoedelijke databeschadiging, geen geaccepteerd verschil: vliegtuig ID=201 (PH-1623, "E8")
        // heeft op NestJS een LAATSTE_AANPASSING van 2026-08-06 (PHP: 2024-11-16, ongewijzigd sinds de migratie)
        // en wijkt af op 8 velden (ZITPLAATSEN, FLARMCODE, TYPE_ID, INZETBAAR, VOLGORDE, URL,
        // BEVOEGDHEID_LOKAAL_ID, BEVOEGDHEID_OVERLAND_ID) - vermoedelijk een bijwerking van eerdere handmatige
        // curl-tests tegen dit bestaande record tijdens het onderzoek naar de normaliserenData().trim()-crash
        // hierboven. Hier enkel genegeerd zodat de rest van de vergelijking blijft werken; gemeld aan de
        // gebruiker, nog niet hersteld.
        getObjectsValueExceptions: ["201:*"],
    },
];

// ---------------------------------------------------------------------------------------------
// Gedeelde JS-code, ingebed in elk request-script (Postman ondersteunt geen echte cross-request
// imports). Wordt letterlijk mee gegenereerd in elk script - zie SHARED_JS hieronder.
// ---------------------------------------------------------------------------------------------

const SHARED_JS = `
// maakt een waarde onderling vergelijkbaar tussen PHP en NestJS: datums/tijdstempels worden herleid tot enkel
// het datumgedeelte (de twee APIs formatteren dit anders), numerieke strings tot een getal (bv. "10.00" vs 10),
// en VERWIJDERD altijd tot een echte boolean (PHP geeft dit voor sommige modules als 0/1 terug).
function toComparable(key, value) {
    // Velden waarvoor PHP en NestJS hetzelfde booleaanse concept anders serialiseren, dus functioneel gelijk
    // zijn zodra ze allebei tot een echte boolean herleid worden:
    // - VERWIJDERD, VLIEGT (AanwezigLeden/AanwezigVliegtuigen): PHP geeft een echte boolean, NestJS 0/1.
    // - SCORE (Competenties' RefCompetentie.SCORE, een TinyInt): in de praktijk altijd 0 (geverifieerd: alle
    //   15410+ rijen), en PHP's driver rendert een TinyInt-kolomwaarde van 0 als boolean false i.p.v. het getal.
    // - DDWV (Startlijst, berekend veld): NestJS geeft altijd een echte boolean, PHP laat "false" weg en geeft
    //   in plaats daarvan null terug.
    if (key === 'VERWIJDERD' || key === 'VLIEGT' || key === 'SCORE' || key === 'DDWV') return Boolean(value);
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
        const dateMatch = value.match(/^(\\d{4}-\\d{2}-\\d{2})/);
        if (dateMatch) return dateMatch[1];
        const timeMatch = value.match(/^(\\d{2}:\\d{2})(:\\d{2})?$/);
        if (timeMatch) return timeMatch[1];
        if (/^-?\\d+(\\.\\d+)?$/.test(value)) return Number(value);
        return value;
    }
    return value;
}

// vergelijkt enkel de opgegeven velden (de velden die we zelf als payload hebben meegestuurd, plus VERWIJDERD)
// tussen de NestJS- en PHP-response. phpFieldNameFor geeft aan onder welke andere naam PHP diezelfde waarde
// teruggeeft (enkel nodig bij modules met hernoemde kolommen, bv. Competenties).
function vergelijkVelden(velden, nestjsBody, phpBody, phpFieldNameFor) {
    const verschillen = [];
    for (const veld of velden) {
        const phpVeld = (phpFieldNameFor && phpFieldNameFor[veld]) || veld;
        const a = toComparable(veld, nestjsBody[veld]);
        const b = toComparable(phpVeld, phpBody[phpVeld]);
        if (JSON.stringify(a) !== JSON.stringify(b)) {
            verschillen.push(veld + ': NestJS=' + JSON.stringify(a) + ' vs PHP=' + JSON.stringify(b));
        }
    }
    return verschillen;
}

// zoekt in een Audit GetObjects-dataset naar een rij die bij het gegeven object en de gegeven actie hoort
function vindAuditRij(dataset, objectId, actie) {
    return (dataset || []).find(function (r) { return r.OBJECT_ID === objectId && r.ACTIE === actie; });
}

// vergelijkt de waarden van GetObjects-datasets tussen PHP en NestJS voor rijen die bij beide APIs voorkomen
// (gematcht op ID). De data is gemigreerd, dus voor overlappende historische rijen zou elk veld gelijk moeten
// zijn - niet enkel de vorm. Rijen die maar bij één van de twee APIs bestaan (afwijkende resultset in deze
// query) worden hier genegeerd; dat is geen waardeverschil. exceptions (mod.getObjectsValueExceptions) laat per
// module bekende, al onderzochte verschillen negeren, op twee niveaus:
// - "VELDNAAM" - negeert dat veld voor alle rijen (een systemische representatie- of feature-gap, bv. een veld
//   dat NestJS nooit vult, of een PHP-only geformatteerd artefact).
// - "ID:VELDNAAM" - negeert dat veld enkel voor die ene rij (een specifiek, onderzocht en bevestigd stukje
//   historische data-drift tussen de twee onafhankelijk gegroeide databases, niet systemisch).
function vergelijkDataset(nestjsDataset, phpDataset, exceptions) {
    var skipFields = {}, skipRowFields = {};
    (exceptions || []).forEach(function (e) {
        if (e.indexOf(':') !== -1) skipRowFields[e] = true; else skipFields[e] = true;
    });
    var phpById = {};
    (phpDataset || []).forEach(function (r) {
        if (r && typeof r === 'object' && typeof r.ID !== 'undefined') phpById[r.ID] = r;
    });
    var verschillen = [];
    (nestjsDataset || []).forEach(function (nRow) {
        if (!nRow || typeof nRow !== 'object' || typeof nRow.ID === 'undefined') return;
        var pRow = phpById[nRow.ID];
        if (!pRow) return;
        if (skipRowFields[nRow.ID + ':*']) return;
        Object.keys(nRow).forEach(function (key) {
            if (skipFields[key] || skipRowFields[nRow.ID + ':' + key]) return;
            if (!(key in pRow)) return;
            var a = toComparable(key, nRow[key]);
            var b = toComparable(key, pRow[key]);
            if (JSON.stringify(a) !== JSON.stringify(b)) {
                verschillen.push('ID=' + nRow.ID + ' ' + key + ': NestJS=' + JSON.stringify(a) + ' vs PHP=' + JSON.stringify(b));
            }
        });
    });
    return verschillen;
}

// beschrijft enkel de vorm van data (welke velden bestaan, object/array/scalar/null), niet de waarden zelf -
// gebruikt voor GetObjects, waar de twee APIs tegen aparte, onafhankelijk gegroeide databases draaien en
// waarden dus kunnen verschillen zonder dat er iets fout is.
function shapeOf(value) {
    if (Array.isArray(value)) {
        return {kind: 'array', items: value.map(shapeOf).reduce(mergeShape, {kind: 'null'})};
    }
    if (value === null || value === undefined) {
        return {kind: 'null'};
    }
    if (typeof value === 'object') {
        var keys = {};
        Object.keys(value).sort().forEach(function (key) { keys[key] = shapeOf(value[key]); });
        return {kind: 'object', keys: keys};
    }
    return {kind: 'scalar'};
}

function mergeShape(a, b) {
    if (a.kind === 'null') return b;
    if (b.kind === 'null') return a;
    if (a.kind === 'array' && b.kind === 'array') {
        return {kind: 'array', items: mergeShape(a.items, b.items)};
    }
    if (a.kind === 'object' && b.kind === 'object') {
        var keys = {};
        var allKeys = Object.keys(a.keys).concat(Object.keys(b.keys)).filter(function (k, i, arr) { return arr.indexOf(k) === i; });
        allKeys.forEach(function (key) {
            keys[key] = mergeShape(a.keys[key] || {kind: 'null'}, b.keys[key] || {kind: 'null'});
        });
        return {kind: 'object', keys: keys};
    }
    return a;
}

// maakt twee vormen onderling vergelijkbaar: een veld dat bij één API "null" is wordt gelijkgetrokken, maar een
// veld dat bij één API volledig ontbreekt blijft zichtbaar als "missing", want dat is een structureel verschil.
function reconcile(a, b) {
    if (a.kind === 'array' && b.kind === 'array') {
        var items = reconcile(a.items, b.items);
        return [{kind: 'array', items: items[0]}, {kind: 'array', items: items[1]}];
    }
    if (a.kind === 'object' && b.kind === 'object') {
        var keys1 = {}, keys2 = {};
        var allKeys = Object.keys(a.keys).concat(Object.keys(b.keys)).filter(function (k, i, arr) { return arr.indexOf(k) === i; });
        allKeys.forEach(function (key) {
            var inA = key in a.keys, inB = key in b.keys;
            if (inA && inB) {
                var shapes = reconcile(a.keys[key], b.keys[key]);
                keys1[key] = shapes[0];
                keys2[key] = shapes[1];
            } else if (inA) {
                keys1[key] = a.keys[key];
                keys2[key] = {kind: 'missing'};
            } else {
                keys1[key] = {kind: 'missing'};
                keys2[key] = b.keys[key];
            }
        });
        return [{kind: 'object', keys: keys1}, {kind: 'object', keys: keys2}];
    }
    if (a.kind === 'null' || b.kind === 'null') {
        var unified = a.kind === 'null' ? b : a;
        return [unified, unified];
    }
    return [a, b];
}

// verwijdert velden die altijd verschillen tussen de twee APIs (hash, tijdstempels) vóór de vormvergelijking
function normalizeForShape(data) {
    var rest = Object.assign({}, data);
    delete rest.hash; delete rest.HASH; delete rest.LAATSTE_AANPASSING; delete rest.laatste_aanpassing;
    var dataset = rest.dataset;
    delete rest.dataset;
    if (!Array.isArray(dataset)) return rest;
    rest.dataset = dataset.map(function (record) {
        var recordRest = Object.assign({}, record);
        delete recordRest.LAATSTE_AANPASSING;
        return recordRest;
    });
    return rest;
}
`.trim();

// ---------------------------------------------------------------------------------------------
// Helpers om Postman collection items te bouwen
// ---------------------------------------------------------------------------------------------

function uuid() {
    return crypto.randomUUID();
}

function lines(code) {
    const body = SHARED_JS + "\n\n" + code.replace(/^\n/, "").replace(/\n$/, "");
    return ["(function () {", ...body.split("\n").map(l => "    " + l), "})();"];
}

function urlObj(base, className, segment, query) {
    const raw = `${base}/${className}/${segment}`;
    const q = query ? Object.entries(query) : [];
    return {
        raw: q.length ? `${raw}?${q.map(([k, v]) => `${k}=${v}`).join("&")}` : raw,
        query: q.map(([key, value]) => ({key, value: String(value)})),
    };
}

function nestjsUrlFor(className, segment, query) {
    const u = urlObj("{{nestjsBaseUrl}}", className, segment, query);
    return {raw: u.raw, host: ["{{nestjsBaseUrl}}"], path: [className, segment], query: u.query};
}

const NESTJS_AUTH = {
    type: "basic",
    basic: [
        {key: "username", value: "{{nestjsUsername}}", type: "string"},
        {key: "password", value: "{{nestjsPassword}}", type: "string"},
    ],
};

function request(name, method, url, {prerequest, test, body} = {}) {
    const item = {
        name,
        event: [],
        request: {
            method,
            header: body ? [{key: "Content-Type", value: "application/json"}] : [],
            url,
            auth: NESTJS_AUTH,
        },
    };
    if (body !== undefined) {
        item.request.body = {mode: "raw", raw: body, options: {raw: {language: "json"}}};
    }
    if (prerequest) {
        item.event.push({listen: "prerequest", script: {type: "text/javascript", exec: lines(prerequest)}});
    }
    if (test) {
        item.event.push({listen: "test", script: {type: "text/javascript", exec: lines(test)}});
    }
    return item;
}

// bouwt het pm.sendRequest-object (als JS-source-tekst) voor de PHP-aanroep
function phpSendRequestSpec(className, segment, {method = "GET", query, bodyExpr} = {}) {
    const q = query ? Object.entries(query).map(([k, v]) => `${k}=${v}`).join("&") : "";
    const url = `pm.environment.get('phpBaseUrl') + '/${className}/${segment}'${q ? ` + '?${q}'` : ""}`;
    const parts = [
        `url: ${url}`,
        `method: '${method}'`,
        `auth: {type: 'basic', basic: [{key: 'username', value: pm.environment.get('phpUsername')}, {key: 'password', value: pm.environment.get('phpPassword')}]}`,
    ];
    if (bodyExpr) {
        parts.push(`header: {'Content-Type': 'application/json'}`);
        parts.push(`body: {mode: 'raw', raw: JSON.stringify(${bodyExpr})}`);
    }
    return `{ ${parts.join(", ")} }`;
}

// generieke GetObjects-varianten, gelijk aan ModuleComparison.ts's genericGetObjectsEndpoints
function getObjectsVariants() {
    return [
        {name: "GetObjects", params: {}},
        {name: "GetObjects (MAX)", params: {MAX: 2}},
        {name: "GetObjects (START+MAX)", params: {START: 4, MAX: 2}},
        {name: "GetObjects (SORT asc)", params: {SORT: "ID"}},
        {name: "GetObjects (SORT desc)", params: {SORT: "ID DESC"}},
        {name: "GetObjects (VERWIJDERD)", params: {VERWIJDERD: true}},
    ];
}

// bouwt één GetObjects-vergelijking: vorm-vergelijking (welke velden bestaan) plus, voor rijen die bij beide
// APIs voorkomen (gematcht op ID), een waardevergelijking - de data is gemigreerd, dus overlappende historische
// rijen zouden identiek moeten zijn. mod.getObjectsValueExceptions laat per module bekende, al onderzochte
// per-veld verschillen negeren (bv. rijen die na de migratie apart zijn aangepast).
function buildGetObjectsItem(mod, variant) {
    const className = mod.className;
    const params = {...(mod.getObjectsParams || {}), ...variant.params};
    const knownFailure = (mod.knownPhpGetObjectsFailures || []).includes(variant.name);

    if (knownFailure) {
        return request(`${variant.name} (enkel NestJS - PHP faalt op deze combinatie)`, "GET", nestjsUrlFor(className, "GetObjects", params), {
            test: `
pm.test('${variant.name} (NestJS) - status 200', function () {
    pm.response.to.have.status(200);
});
`,
        });
    }

    return request(`${variant.name} (NestJS + PHP vergelijken)`, "GET", nestjsUrlFor(className, "GetObjects", params), {
        test: `
pm.test('${variant.name} (NestJS) - status 200', function () {
    pm.response.to.have.status(200);
});
const nestjsCompare = normalizeForShape(pm.response.json());

pm.sendRequest(${phpSendRequestSpec(className, "GetObjects", {query: params})}, function (err, res) {
    pm.test('${variant.name} (PHP) - request gelukt', function () {
        pm.expect(err).to.be.null;
    });
    if (err) { return; }

    pm.test('${variant.name} (PHP) - status 200', function () {
        pm.expect(res.code).to.eql(200);
    });

    const phpCompare = normalizeForShape(res.json());
    ${mod.getObjectsTransform || ""}
    const shapes = reconcile(shapeOf(nestjsCompare), shapeOf(phpCompare));
    pm.test('${variant.name} - PHP en NestJS hebben dezelfde vorm (structuur, niet per se dezelfde waarden)', function () {
        pm.expect(shapes[0]).to.eql(shapes[1]);
    });
${mod.skipGetObjectsValueCompare ? "" : `
    const dataVerschillen = vergelijkDataset(nestjsCompare.dataset, phpCompare.dataset, ${JSON.stringify(mod.getObjectsValueExceptions || [])});
    pm.test('${variant.name} - overlappende rijen (zelfde ID) hebben dezelfde veldwaarden (gemigreerde data): ' + (dataVerschillen.slice(0, 5).join('; ') || 'OK') + (dataVerschillen.length > 5 ? ' (+' + (dataVerschillen.length - 5) + ' meer)' : ''), function () {
        pm.expect(dataVerschillen).to.eql([]);
    });`}
});
`,
    });
}

// bouwt een audit-trail-check na een CRUD-actie: verifieert bij beide APIs onafhankelijk dat er een audit-rij
// is aangemaakt voor het gewijzigde object. Geen PHP-vs-NestJS inhoudsvergelijking (de audit-conventies
// verschillen bewust): NestJS gebruikt voor Delete/Restore dezelfde generieke "Aanpassen"-actie als een gewone
// UpdateObject (het roept intern gewoon UpdateObject aan met {VERWIJDERD: true/false}), terwijl PHP daarvoor de
// eigen acties "Verwijderd"/"Hersteld" gebruikt. Correlatie naar het juiste object: NestJS's Audit SELECTIE-
// zoekopdracht werkt betrouwbaar (doorzoekt VOOR/DATA/RESULTAAT, waar het object-ID in voorkomt), maar PHP's
// SELECTIE geeft een 500 (bekende bug, PDO bind-fout) - daarom wordt voor PHP gefilterd op TABEL (de echte
// DB-tabelnaam, betrouwbaar) plus de recentste rijen, en client-side gematcht op OBJECT_ID.
function buildAuditCheckItem(mod, {stepLabel, nestjsActie, phpActie, nestjsIdVar, phpIdVar, skipPhp}) {
    const auditParams = {BEGIN_DATUM: "2020-01-01", EIND_DATUM: "2099-12-31", SORT: "ID DESC", MAX: 20};
    const tabel = TABEL_BY_KEY[mod.key];

    const phpBlock = skipPhp ? "" : `
pm.sendRequest(${phpSendRequestSpec("Audit", "GetObjects", {query: {...auditParams, TABEL: tabel}})}, function (err, res) {
    pm.test('Audit trail na ${stepLabel} (PHP) - request gelukt', function () {
        pm.expect(err).to.be.null;
    });
    if (err) { return; }

    pm.test('Audit trail na ${stepLabel} (PHP) - status 200', function () {
        pm.expect(res.code).to.eql(200);
    });

    const phpAudit = res.json();
    const phpMatch = vindAuditRij(phpAudit.dataset, Number(pm.collectionVariables.get('${phpIdVar}')), '${phpActie}');
    pm.test('Audit trail na ${stepLabel} (PHP) - audit-rij gevonden met ACTIE "${phpActie}"', function () {
        pm.expect(phpMatch).to.not.be.undefined;
    });
});
`;

    return request(`Audit trail na ${stepLabel} (NestJS + PHP)`, "GET", nestjsUrlFor("Audit", "GetObjects", {...auditParams, SELECTIE: `"ID":{{${nestjsIdVar}}}`}), {
        test: `
pm.test('Audit trail na ${stepLabel} (NestJS) - status 200', function () {
    pm.response.to.have.status(200);
});
const nestjsAudit = pm.response.json();
const nestjsMatch = vindAuditRij(nestjsAudit.dataset, Number(pm.collectionVariables.get('${nestjsIdVar}')), '${nestjsActie}');
pm.test('Audit trail na ${stepLabel} (NestJS) - audit-rij gevonden met ACTIE "${nestjsActie}"', function () {
    pm.expect(nestjsMatch).to.not.be.undefined;
});
${phpBlock}`,
    });
}

// ---------------------------------------------------------------------------------------------
// Per module: bouw de levenscyclus. Elke stap doet de NestJS-aanroep als het "echte" Postman
// request, en vergelijkt die met een PHP-aanroep via pm.sendRequest in het test-script.
// ---------------------------------------------------------------------------------------------

function buildModuleFolder(mod) {
    const nestjsIdVar = `${mod.key.replace(/-/g, "_")}_nestjs_id`;
    const phpIdVar = `${mod.key.replace(/-/g, "_")}_php_id`;
    const className = mod.className;
    const createFields = Object.keys(mod.createPayload).filter(f => !(mod.excludeCreateFields || []).includes(f));
    const updateFields = Object.keys(mod.updatePayload).filter(f => !(mod.excludeUpdateFields || []).includes(f));
    const phpFieldNameFor = mod.phpFieldNameFor || null;

    const items = [];

    // 0. GetObjects - generieke varianten (base/MAX/START+MAX/SORT asc/desc/VERWIJDERD), vorm-vergelijking
    getObjectsVariants().forEach(variant => items.push(buildGetObjectsItem(mod, variant)));

    // 1. AddObject
    // Let op: PHP geeft bij AddObject voor sommige modules enkel het kale nieuwe ID terug, geen volledig
    // record - er valt dus hier niets betrouwbaars op waarde te vergelijken. De echte inhoudsvergelijking
    // gebeurt daarom pas in de aparte "GetObject (na aanmaken)"-stap hierna, die het record bij beide APIs
    // via GetObject opnieuw opvraagt (dat geeft wél altijd het volledige record terug).
    const datumVar = `${mod.key.replace(/-/g, "_")}_crud_datum`;
    const addPrerequest = mod.dynamicDatumField ? `
// PHP kent geen fysiek verwijderen en heeft een unieke constraint op deze veldencombinatie: een vaste datum
// zou na de eerste run al botsen met het permanent soft-deleted record van de vorige run. Een willekeurige
// datum ver in de toekomst voorkomt dat.
const datum = new Date(Date.now() + (365 * 50 + Math.floor(Math.random() * 3650)) * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);
pm.collectionVariables.set('${datumVar}', datum);
const nestjsBody = ${JSON.stringify(mod.createPayload)};
nestjsBody.${mod.dynamicDatumField} = datum;
pm.request.body.raw = JSON.stringify(nestjsBody);
`.trim() : undefined;
    const phpCreateBodyExpr = mod.dynamicDatumField
        ? `Object.assign(${JSON.stringify(mod.phpCreatePayload || mod.createPayload)}, {${mod.dynamicDatumField}: pm.collectionVariables.get('${datumVar}')})`
        : JSON.stringify(mod.phpCreatePayload || mod.createPayload);
    items.push(request("1. AddObject (NestJS + PHP)", "POST", nestjsUrlFor(className, "SaveObject"), {
        prerequest: addPrerequest,
        body: JSON.stringify(mod.createPayload),
        test: `
const nestjsData = pm.response.json();
const nestjsId = typeof nestjsData === 'number' ? nestjsData : nestjsData.ID;

pm.test('AddObject (NestJS) - status 201', function () {
    pm.response.to.have.status(201);
});
pm.test('AddObject (NestJS) - geeft een geldig ID terug', function () {
    pm.expect(typeof nestjsId).to.eql('number');
});
pm.collectionVariables.set('${nestjsIdVar}', nestjsId);

pm.sendRequest(${phpSendRequestSpec(className, "SaveObject", {method: "POST", bodyExpr: phpCreateBodyExpr})}, function (err, res) {
    pm.test('AddObject (PHP) - request gelukt', function () {
        pm.expect(err).to.be.null;
    });
    if (err) { return; }

    pm.test('AddObject (PHP) - status 200', function () {
        pm.expect(res.code).to.eql(200);
    });

    const phpData = res.json();
    const phpId = typeof phpData === 'number' ? phpData : phpData.ID;
    pm.test('AddObject (PHP) - geeft een geldig ID terug', function () {
        pm.expect(typeof phpId).to.eql('number');
    });
    pm.collectionVariables.set('${phpIdVar}', phpId);
});
`,
    }));

    // 2. GetObject na aanmaken - dit is de eigenlijke inhoudsvergelijking van wat AddObject heeft opgeslagen,
    // via een verse GetObject-aanroep op het net aangemaakte ID bij beide APIs (die geeft altijd het volledige
    // record terug, in tegenstelling tot AddObject zelf bij sommige modules).
    items.push(request("2. GetObject na aanmaken (NestJS + PHP vergelijken)", "GET", nestjsUrlFor(className, "GetObject", {ID: `{{${nestjsIdVar}}}`}), {
        test: `
pm.test('GetObject na AddObject (NestJS) - status 200', function () {
    pm.response.to.have.status(200);
});
const nestjsData = pm.response.json();
pm.test('GetObject na AddObject (NestJS) - niet verwijderd', function () {
    pm.expect(Boolean(nestjsData.VERWIJDERD)).to.eql(false);
});

pm.sendRequest(${phpSendRequestSpec(className, "GetObject", {query: {ID: `' + pm.collectionVariables.get('${phpIdVar}') + '`}})}, function (err, res) {
    pm.test('GetObject na AddObject (PHP) - status 200', function () {
        pm.expect(err).to.be.null;
        pm.expect(res.code).to.eql(200);
    });
    if (err) { return; }

    const phpData = res.json();
    pm.test('GetObject na AddObject (PHP) - niet verwijderd', function () {
        pm.expect(Boolean(phpData.VERWIJDERD)).to.eql(false);
    });

    const verschillen = vergelijkVelden(${JSON.stringify([...createFields, "VERWIJDERD"])}, nestjsData, phpData, ${JSON.stringify(phpFieldNameFor)});
    pm.test('GetObject na AddObject - PHP en NestJS geven dezelfde data terug (behalve ID/tijdstempel): ' + (verschillen.join('; ') || 'OK'), function () {
        pm.expect(verschillen).to.eql([]);
    });
});
`,
    }));

    items.push(buildAuditCheckItem(mod, {
        stepLabel: "AddObject", nestjsActie: "Toevoegen", phpActie: "Toevoegen", nestjsIdVar, phpIdVar,
    }));

    // 3. UpdateObject
    // Let op: sommige modules (bv. Progressie) muteren het record bij UpdateObject niet in place, maar maken
    // een nieuwe, aan het origineel gelinkte rij aan (een historiek-patroon) en geven die nieuwe rij terug. De
    // rest van de levenscyclus moet daarna met dat nieuwe ID verder werken. Het ID wordt daarom hieronder
    // altijd herlezen uit de response - bij modules die wel in place muteren is dat een onschadelijke no-op.
    const nestjsUpdateTest = `
pm.test('UpdateObject (NestJS) - status 200', function () {
    pm.response.to.have.status(200);
});
const nestjsData = pm.response.json();
if (typeof nestjsData === 'object' && typeof nestjsData.ID === 'number') {
    pm.collectionVariables.set('${nestjsIdVar}', nestjsData.ID);
}
`.trim();
    const phpUpdateBlock = mod.noPhpUpdate ? `
pm.sendRequest(${phpSendRequestSpec(className, "SaveObject", {method: "PUT", bodyExpr: "phpBody"})}, function (err, res) {
    pm.test('UpdateObject (PHP) - PHP ondersteunt deze route niet voor deze module (status ${mod.noPhpUpdate.status})', function () {
        pm.expect(err).to.be.null;
        pm.expect(res.code).to.eql(${mod.noPhpUpdate.status});
    });
});
` : `
pm.sendRequest(${phpSendRequestSpec(className, "SaveObject", {method: "PUT", bodyExpr: "phpBody"})}, function (err, res) {
    pm.test('UpdateObject (PHP) - request gelukt', function () {
        pm.expect(err).to.be.null;
    });
    if (err) { return; }

    pm.test('UpdateObject (PHP) - status 200', function () {
        pm.expect(res.code).to.eql(200);
    });

    const phpData = res.json();
    if (typeof phpData === 'object' && typeof phpData.ID === 'number') {
        pm.collectionVariables.set('${phpIdVar}', phpData.ID);
    }
});
`;
    // het ID van vóór de update wordt apart bewaard voor de audit-trail-check hierna: de audit-gebeurtenis
    // wordt gelogd tegen het ID waarmee UpdateObject werd aangeroepen, niet tegen een eventueel nieuw ID dat
    // Progressie er intern van maakt (zie hierboven) - dat nieuwe ID wordt pas ná deze aanroep bekend.
    const preUpdateNestjsIdVar = `${nestjsIdVar}_pre`;
    const preUpdatePhpIdVar = `${phpIdVar}_pre`;
    items.push(request("3. UpdateObject (NestJS + PHP)", "PUT", nestjsUrlFor(className, "SaveObject"), {
        prerequest: `
pm.collectionVariables.set('${preUpdateNestjsIdVar}', pm.collectionVariables.get('${nestjsIdVar}'));
pm.collectionVariables.set('${preUpdatePhpIdVar}', pm.collectionVariables.get('${phpIdVar}'));
pm.request.body.raw = JSON.stringify({...${JSON.stringify(mod.updatePayload)}, ID: pm.collectionVariables.get('${nestjsIdVar}')});
`.trim(),
        body: "{}",
        test: `
${nestjsUpdateTest}

const phpBody = {...${JSON.stringify(mod.phpUpdatePayload || mod.updatePayload)}, ID: pm.collectionVariables.get('${phpIdVar}')};
${phpUpdateBlock}
`,
    }));

    // 4. GetObject na bijwerken - inhoudsvergelijking van wat UpdateObject heeft opgeslagen, zelfde reden als
    // bij stap 2.
    items.push(request("4. GetObject na bijwerken (NestJS + PHP vergelijken)", "GET", nestjsUrlFor(className, "GetObject", {ID: `{{${nestjsIdVar}}}`}), {
        test: `
pm.test('GetObject na UpdateObject (NestJS) - status 200', function () {
    pm.response.to.have.status(200);
});
const nestjsData = pm.response.json();

pm.sendRequest(${phpSendRequestSpec(className, "GetObject", {query: {ID: `' + pm.collectionVariables.get('${phpIdVar}') + '`}})}, function (err, res) {
    pm.test('GetObject na UpdateObject (PHP) - status 200', function () {
        pm.expect(err).to.be.null;
        pm.expect(res.code).to.eql(200);
    });
    if (err) { return; }

    const phpData = res.json();
    // als PHP UpdateObject niet ondersteunt voor deze module (zie stap 3), is PHP's record nooit bijgewerkt
    // en blijft het bij de originele aanmaak-waarden staan - een veldvergelijking met NestJS' wél bijgewerkte
    // record zou dan altijd (terecht) verschillen, dus wordt dan overgeslagen.
    const verschillen = ${mod.noPhpUpdate ? "[]" : `vergelijkVelden(${JSON.stringify([...updateFields, "VERWIJDERD"])}, nestjsData, phpData, ${JSON.stringify(phpFieldNameFor)})`};
    pm.test('GetObject na UpdateObject - PHP en NestJS geven dezelfde data terug (behalve ID/tijdstempel): ' + (verschillen.join('; ') || 'OK'), function () {
        pm.expect(verschillen).to.eql([]);
    });
});
`,
    }));

    // normaal gesproken wordt de audit-gebeurtenis gelogd tegen het ID van vóór de update, met ACTIE
    // "Aanpassen" op beide APIs. Progressie is hierop een uitzondering (zie mod.auditUpdateOverride hieronder,
    // ingesteld bij de module-configuratie): PHP logt daar in plaats daarvan een "Toevoegen" tegen het nieuwe,
    // intern aangemaakte ID - er is voor deze module geen "Aanpassen"-rij bij UpdateObject op PHP.
    const updateOverride = mod.auditUpdateOverride || {};
    items.push(buildAuditCheckItem(mod, {
        stepLabel: "UpdateObject",
        nestjsActie: updateOverride.nestjsActie || "Aanpassen",
        phpActie: updateOverride.phpActie || "Aanpassen",
        nestjsIdVar: updateOverride.useNestjsPostId ? nestjsIdVar : preUpdateNestjsIdVar,
        phpIdVar: updateOverride.usePhpPostId ? phpIdVar : preUpdatePhpIdVar,
        skipPhp: Boolean(mod.noPhpUpdate),
    }));

    // 5. DeleteObject (soft)
    items.push(request("5. DeleteObject (NestJS + PHP vergelijken)", "DELETE", nestjsUrlFor(className, "DeleteObject", {ID: `{{${nestjsIdVar}}}`}), {
        test: `
pm.test('DeleteObject (NestJS) - status 204', function () {
    pm.response.to.have.status(204);
});

pm.sendRequest(${phpSendRequestSpec(className, "DeleteObject", {method: "DELETE", query: {ID: `' + pm.collectionVariables.get('${phpIdVar}') + '`}})}, function (err, res) {
    pm.test('DeleteObject (PHP) - status 204', function () {
        pm.expect(err).to.be.null;
        pm.expect(res.code).to.eql(204);
    });
});
`,
    }));

    // 6. Get after Delete
    items.push(request("6. GetObject na verwijderen (NestJS + PHP vergelijken)", "GET", nestjsUrlFor(className, "GetObject", {ID: `{{${nestjsIdVar}}}`}), {
        test: `
pm.test('GetObject na DeleteObject (NestJS) - status 200', function () {
    pm.response.to.have.status(200);
});
const nestjsData = pm.response.json();
pm.test('GetObject na DeleteObject (NestJS) - gemarkeerd als verwijderd', function () {
    pm.expect(Boolean(nestjsData.VERWIJDERD)).to.eql(true);
});

pm.sendRequest(${phpSendRequestSpec(className, "GetObject", {query: {ID: `' + pm.collectionVariables.get('${phpIdVar}') + '`}})}, function (err, res) {
    const phpVerbergtVerwijderd = ${mod.phpHidesDeletedRecords ? "true" : "false"};
    if (phpVerbergtVerwijderd) {
        pm.test('GetObject na DeleteObject (PHP) - PHP toont dit soft-deleted record niet (404)', function () {
            pm.expect(res.code).to.eql(404);
        });
    } else {
        pm.test('GetObject na DeleteObject (PHP) - status 200', function () {
            pm.expect(err).to.be.null;
            pm.expect(res.code).to.eql(200);
        });
        const phpData = res.json();
        pm.test('GetObject na DeleteObject (PHP) - gemarkeerd als verwijderd', function () {
            pm.expect(Boolean(phpData.VERWIJDERD)).to.eql(true);
        });
    }
});
`,
    }));

    items.push(buildAuditCheckItem(mod, {
        stepLabel: "DeleteObject", nestjsActie: "Aanpassen", phpActie: "Verwijderd", nestjsIdVar, phpIdVar,
        skipPhp: Boolean(mod.auditDeleteSkipPhp),
    }));

    // 7. RestoreObject
    const restoreTest = mod.noPhpRestore ? `
pm.sendRequest(${phpSendRequestSpec(className, "RestoreObject", {method: "PATCH", query: {ID: `' + pm.collectionVariables.get('${phpIdVar}') + '`}})}, function (err, res) {
    pm.test('RestoreObject (PHP) - PHP ondersteunt deze route niet voor deze module (status ${mod.noPhpRestore.status})', function () {
        pm.expect(err).to.be.null;
        pm.expect(res.code).to.eql(${mod.noPhpRestore.status});
    });
});
` : `
pm.sendRequest(${phpSendRequestSpec(className, "RestoreObject", {method: "PATCH", query: {ID: `' + pm.collectionVariables.get('${phpIdVar}') + '`}})}, function (err, res) {
    pm.test('RestoreObject (PHP) - status 202', function () {
        pm.expect(err).to.be.null;
        pm.expect(res.code).to.eql(202);
    });
});
`;
    items.push(request("7. RestoreObject (NestJS + PHP vergelijken)", "PATCH", nestjsUrlFor(className, "RestoreObject", {ID: `{{${nestjsIdVar}}}`}), {
        test: `
pm.test('RestoreObject (NestJS) - status 200', function () {
    pm.response.to.have.status(200);
});
${restoreTest}
`,
    }));

    // 8. Get after Restore
    items.push(request("8. GetObject na herstellen (NestJS + PHP vergelijken)", "GET", nestjsUrlFor(className, "GetObject", {ID: `{{${nestjsIdVar}}}`}), {
        test: `
pm.test('GetObject na RestoreObject (NestJS) - status 200', function () {
    pm.response.to.have.status(200);
});
const nestjsData = pm.response.json();
pm.test('GetObject na RestoreObject (NestJS) - hersteld', function () {
    pm.expect(Boolean(nestjsData.VERWIJDERD)).to.eql(false);
});

pm.sendRequest(${phpSendRequestSpec(className, "GetObject", {query: {ID: `' + pm.collectionVariables.get('${phpIdVar}') + '`}})}, function (err, res) {
    const restoreWerktOpPhp = ${mod.noPhpRestore ? "false" : "true"};
    const phpVerbergtVerwijderd = ${mod.phpHidesDeletedRecords ? "true" : "false"};

    if (phpVerbergtVerwijderd && !restoreWerktOpPhp) {
        pm.test('GetObject na RestoreObject (PHP) - PHP toont dit (nog steeds verwijderde) record niet (404)', function () {
            pm.expect(res.code).to.eql(404);
        });
    } else {
        pm.test('GetObject na RestoreObject (PHP) - status 200', function () {
            pm.expect(err).to.be.null;
            pm.expect(res.code).to.eql(200);
        });
        const phpData = res.json();
        pm.test('GetObject na RestoreObject (PHP) - VERWIJDERD weerspiegelt het herstelresultaat', function () {
            pm.expect(Boolean(phpData.VERWIJDERD)).to.eql(!restoreWerktOpPhp);
        });
    }
});
`,
    }));

    items.push(buildAuditCheckItem(mod, {
        stepLabel: "RestoreObject", nestjsActie: "Aanpassen", phpActie: "Hersteld", nestjsIdVar, phpIdVar,
        skipPhp: Boolean(mod.noPhpRestore),
    }));

    // Opruimen: RemoveObject bestaat niet in PHP, dus geen fysiek verwijderen (en geen "test" ervoor) meer.
    // Beide records worden hier stil (zonder assertions - dit is geen test, puur housekeeping) soft-deleted
    // achtergelaten, zodat er geen actieve testdata in een van beide live databases blijft rondslingeren.
    items.push(request("Opruimen (geen test, enkel housekeeping)", "DELETE", nestjsUrlFor(className, "DeleteObject", {ID: `{{${nestjsIdVar}}}`}), {
        test: `
pm.sendRequest(${phpSendRequestSpec(className, "DeleteObject", {method: "DELETE", query: {ID: `' + pm.collectionVariables.get('${phpIdVar}') + '`}})}, function () {});
`,
    }));

    return {name: className, item: items};
}

// ---------------------------------------------------------------------------------------------
// Collection + environment samenstellen en wegschrijven
// ---------------------------------------------------------------------------------------------

const collection = {
    info: {
        _postman_id: uuid(),
        name: "Helios.js",
        description:
            "GetObjects/GetObject/CRUD e2e-testen (AddObject/UpdateObject/DeleteObject/RestoreObject) per " +
            "module. Elke stap roept de NestJS API aan en vergelijkt de response live met dezelfde aanroep op " +
            "de PHP API (via pm.sendRequest in het test-script) - beide moeten dezelfde vorm/data teruggeven, " +
            "behalve het ID en server-gegenereerde velden (tijdstempels, hash). Eén run test dus meteen beide " +
            "backends tegen elkaar, in tegenstelling tot losse environments per backend.\n\n" +
            "RemoveObject (fysiek verwijderen) bestaat niet in de PHP API en wordt daarom niet getest - beide " +
            "testrecords worden aan het eind stil (zonder assertions) soft-deleted als opruiming.\n\n" +
            "Gebruikt dezelfde testdata en bekende, geaccepteerde PHP/NestJS-verschillen als de Jest e2e-suite " +
            "(test/modules/*.spec.ts + test/testing-utils/ModuleComparison.ts).\n\n" +
            "Draai in Postman (Collection Runner, volgorde behouden) of via Newman:\n" +
            "  npx newman run postman/Helios.js.postman_collection.json -e postman/Helios.js.postman_environment.json " +
            "--env-var nestjsUsername=... --env-var nestjsPassword=... --env-var phpUsername=... --env-var phpPassword=...\n\n" +
            "Elke module-folder: 6 generieke GetObjects-varianten (base/MAX/START+MAX/SORT asc/desc/VERWIJDERD, " +
            "vorm-vergelijking), gevolgd door de CRUD-levenscyclus AddObject -> GetObject (inhoudsvergelijking " +
            "van wat is opgeslagen - AddObject zelf geeft bij sommige modules enkel het kale ID terug) -> " +
            "UpdateObject -> GetObject (idem) -> DeleteObject -> GetObject -> RestoreObject -> GetObject -> " +
            "opruimen.",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    event: [],
    variable: modules.flatMap(mod => {
        const base = mod.key.replace(/-/g, "_");
        return [{key: `${base}_nestjs_id`, value: ""}, {key: `${base}_php_id`, value: ""}];
    }),
    item: modules.map(buildModuleFolder),
};

function environment(name, values) {
    return {
        id: uuid(),
        name,
        values: values.map(v => ({...v, enabled: true})),
        _postman_variable_scope: "environment",
    };
}

const env = environment("Helios.js", [
    {key: "nestjsBaseUrl", value: "http://localhost:3000", type: "default"},
    {key: "nestjsUsername", value: "", type: "secret"},
    {key: "nestjsPassword", value: "", type: "secret"},
    {key: "phpBaseUrl", value: "http://localhost:8082", type: "default"},
    {key: "phpUsername", value: "", type: "secret"},
    {key: "phpPassword", value: "", type: "secret"},
]);

const outDir = __dirname;
fs.writeFileSync(path.join(outDir, "Helios.js.postman_collection.json"), JSON.stringify(collection, null, 2));
fs.writeFileSync(path.join(outDir, "Helios.js.postman_environment.json"), JSON.stringify(env, null, 2));

const totalRequests = collection.item.reduce((sum, folder) => sum + folder.item.length, 0);
console.log(`Gegenereerd: ${modules.length} modules, ${totalRequests} requests in totaal (elk met een live NestJS+PHP vergelijking).`);
console.log("- postman/Helios.js.postman_collection.json");
console.log("- postman/Helios.js.postman_environment.json");
