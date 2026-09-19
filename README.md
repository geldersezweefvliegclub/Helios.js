<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">Een progressief <a href="http://nodejs.org" target="_blank">Node.js</a> framework voor het bouwen van efficiënte en schaalbare server-side applicaties.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Beschrijving

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project opzetten

```bash
$ npm install
```

## Project compileren en uitvoeren

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Tests uitvoeren

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Prisma: waarom deze codebase overal "Unchecked" gebruikt

Elk Prisma-model met een foreign-key-relatie krijgt **twee** gegenereerde input-types
voor `create`/`update`-aanroepen:

- **Checked** (bijv. `Prisma.OperStartlijstCreateInput`) — een foreign key moet worden
  gezet via het *relatie*-veld met een geneste operatie, bijv.
  `Vliegtuig: { connect: { ID: 604 } }`.
- **Unchecked** (bijv. `Prisma.OperStartlijstUncheckedCreateInput`) — de foreign key mag
  rechtstreeks als scalaire kolom gezet worden, bijv. `VLIEGTUIG_ID: 604`.

Beide leveren identieke SQL op: Prisma Client kijkt tijdens het uitvoeren alleen naar de
vorm van het object dat je meegeeft, nooit naar welk TypeScript-type je hebt
gedeclareerd. De referentiële integriteit van de foreign keys wordt volledig door MySQL
zelf afgedwongen (dit project gebruikt Prisma's standaard `relationMode = "foreignKeys"`,
dus echte database-constraints) — dat heeft niets te maken met welke van de twee
input-varianten je gebruikt.

**Deze codebase gebruikt overal het Unchecked-type**, om twee redenen die specifiek voor
dit project gelden:
- Elke module is verantwoordelijk voor precies één databasetabel. Er wordt nergens een
  nieuw gerelateerd (kind-)record aangemaakt als onderdeel van het schrijven van een
  eigen record — een foreign key verwijst altijd naar een record dat al bestaat, exact
  zoals de oorspronkelijke PHP-implementatie dat ook aannam. Dat is precies de situatie
  waarvoor `Unchecked` bedoeld is; het enige echte voordeel van `Checked` — geneste
  schrijfacties zoals `create`/`connectOrCreate` voor een *nieuw* gerelateerd record in
  dezelfde aanroep — komt in dit project dus nooit van pas.
- Eén consistent patroon is eenvoudiger aan te leren voor nieuwe engineers dan twee
  patronen naast elkaar, zeker omdat request bodies toch al kale foreign-key-nummers
  meesturen (bijv. `VLIEGTUIG_ID`) die 1-op-1 overeenkomen met de gegenereerde DTO's.

**Conventie in deze codebase**: elke `AddObject`/`UpdateObject`-servicefunctie declareert
het **Unchecked**-type, en geeft `data` rechtstreeks door aan `.create()`/`.update()` met
kale scalaire FK-velden — zonder relatie-objecten op te bouwen. Mocht een toekomstige
functie ooit echt een geneste schrijfactie nodig hebben, dan is `Checked` daarvoor de
juiste keuze; tot die tijd houdt één consistent patroon de codebase eenvoudig.

Meer lezen:
- [Prisma Client Reference](https://www.prisma.io/docs/orm/reference/prisma-client-reference)
  — toont beide input-varianten in de daadwerkelijk gegenereerde methode-signaturen.
- ["What does 'Unchecked' mean?"](https://github.com/prisma/orm/discussions/10121) — een
  directe uitleg van het verschil door een Prisma-maintainer.

## Bronnen

Bekijk een aantal bronnen die van pas kunnen komen bij het werken met NestJS:

- Bezoek de [NestJS Documentation](https://docs.nestjs.com) voor meer informatie over het framework.
- Ga voor vragen en ondersteuning naar ons [Discord-kanaal](https://discord.gg/G7Qnnhy).
- Wil je dieper de materie in en meer praktijkervaring opdoen, bekijk dan onze officiële video[cursussen](https://courses.nestjs.com/).
- Visualiseer de grafiek van je applicatie en interacteer in real-time met je NestJS-applicatie via [NestJS Devtools](https://devtools.nestjs.com).
- Hulp nodig bij je project (parttime tot fulltime)? Bekijk onze officiële [enterprise support](https://enterprise.nestjs.com).
- Blijf op de hoogte en volg ons op [X](https://x.com/nestframework) en [LinkedIn](https://linkedin.com/company/nestjs).
- Op zoek naar een baan, of heb je een baan te bieden? Bekijk ons officiële [vacatureoverzicht](https://jobs.nestjs.com).
