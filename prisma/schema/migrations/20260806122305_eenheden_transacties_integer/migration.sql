-- EENHEDEN was Decimal(10,0), maar heeft altijd al 0 decimalen (heel getal). Geen bestaande waarde overschrijdt
-- het bereik van een 32-bit integer, dus dit is een veilige, verliesloze conversie naar een echt geheel getal.
ALTER TABLE `oper_transacties` MODIFY `EENHEDEN` INT NULL;
