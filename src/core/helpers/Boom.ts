export class Boom
{
   static bouwBoom<Type>(data): Type
   {
      // Maak een map om nodes op te slaan op hun ID
      const nodeMap = new Map();

      // Initialiseer de map en zet elke node klaar
      data.forEach((item) =>
      {
         nodeMap.set(item.ID, {...item, children: []});
      });

      // Definieer de root nodes van de boom
      const tree = [];

      data.forEach((item) =>
      {
         const parentID = item.OUDER_ID;
         if (parentID)
         {
            // Voeg het huidige item toe als child van zijn parent
            if (nodeMap.has(parentID))
            {
               nodeMap.get(parentID).children.push(nodeMap.get(item.ID));
            }
         }
         else
         {
            // Als er geen parent ID is, is het een root node
            tree.push(nodeMap.get(item.ID));
         }
      });

      if (tree.length === 1)
         return tree[0] as Type;

      return tree as Type;
   }
}