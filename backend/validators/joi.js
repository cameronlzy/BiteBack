import BaseJoi from 'joi';
import joiObjectId from 'joi-objectid';

const objectIdExtension = joiObjectId(BaseJoi); 
BaseJoi.objectId = objectIdExtension;

export default BaseJoi;
