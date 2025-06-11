import JoiBase from 'joi';
import joiObjectId from 'joi-objectid';

export default function() {
  JoiBase.objectId = joiObjectId(JoiBase);
}