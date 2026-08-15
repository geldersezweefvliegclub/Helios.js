-- TEKST was nullable, maar is altijd al verplicht volgens de business regel uit
-- class.Tracks.inc.php AddObject(). Geen bestaande rij heeft TEKST = NULL, dus dit is veilig.
ALTER TABLE `oper_tracks` MODIFY `TEKST` TEXT NOT NULL;
