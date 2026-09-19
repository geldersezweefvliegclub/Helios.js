// bouwt een GetObjects-request object op met het juiste prototype (bv. GetObjectsDateRequest.VanTot()),
// zodat interne service-naar-service calls niet de kale object-literal + Object.assign hoeven te herhalen
export function MaakGetObjectsRequest<T>(ctor: new () => T, velden: Partial<T>): T
{
   return Object.assign(new ctor(), velden);
}
