import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
    restaurant: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Restaurant', 
        required: true 
    },
    title: { type: String, required: true },
    description: { type: String, require: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    timeWindow: {
        startTime: { type: String }, 
        endTime: { type: String }   
    },
    mainImage: { type: String },
    bannerImage: { type: String },
    searchKeywords: [String],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

promotionSchema.pre('save', function (next) {
  const titleTokens = this.title.toLowerCase().split(' ');
  const descriptionTokens = this.description.toLowerCase().split(' ');

  this.searchKeywords = [...titleTokens, ...descriptionTokens];
  next();
});

function handleSearchKeywordsUpdate() {
  return async function (next) {
    const update = this.getUpdate();
    if (!update) return next();

    const isSet = !!update.$set;
    const updatedFields = isSet ? update.$set : update;

    // if any of name, tags, cuisines are updated, recompute keywords
    const fieldsToUpdate = ['title', 'description'];
    const isUpdating = fieldsToUpdate.some(f => Object.prototype.hasOwnProperty.call(updatedFields, f));

    if (!isUpdating) return next();

    // get current doc
    const docToUpdate = await this.model.findOne(this.getQuery()).lean();

    const titleTokens = updatedFields.title
      ? updatedFields.title.toLowerCase().split(' ')
      : docToUpdate?.title.toLowerCase().split(' ') || [];

    const descriptionTokens = updatedFields.description
      ? updatedFields.description.toLowerCase().split(' ')
      : docToUpdate?.description.toLowerCase().split(' ') || [];

    const searchKeywords = [...titleTokens, ...descriptionTokens];

    if (isSet) {
      update.$set.searchKeywords = searchKeywords;
    } else {
      update.searchKeywords = searchKeywords;
    }

    next();
  };
}

promotionSchema.pre('findOneAndUpdate', handleSearchKeywordsUpdate());
promotionSchema.pre('updateOne', handleSearchKeywordsUpdate());
promotionSchema.pre('updateMany', handleSearchKeywordsUpdate());

promotionSchema.index({ searchKeywords: 1 });
promotionSchema.index({ restaurant: 1 });

const Promotion = mongoose.model('Promotion', promotionSchema);

export default Promotion;