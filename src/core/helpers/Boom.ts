export class Boom
{
   static bouwBoom<Type>(data): Type
   {
      // Create a map to store nodes by their ID
      const nodeMap = new Map();

      // Initialize the map and set up each node
      data.forEach((item) =>
      {
         nodeMap.set(item.ID, {...item, children: []});
      });

      // Define the root nodes of the tree
      const tree = [];

      data.forEach((item) =>
      {
         const parentID = item.OUDER_ID;
         if (parentID)
         {
            // Add current item as a child of its parent
            if (nodeMap.has(parentID))
            {
               nodeMap.get(parentID).children.push(nodeMap.get(item.ID));
            }
         }
         else
         {
            // If no parent ID, it's a root node
            tree.push(nodeMap.get(item.ID));
         }
      });

      if (tree.length === 1)
         return tree[0] as Type;

      return tree as Type;
   }
}