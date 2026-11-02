import { CollectionTypes } from '@bayle/types';
import mongoose from 'mongoose';

const EmailSchema = new mongoose.Schema<CollectionTypes.Email>({
  realmId: String,
  templateName: String,
  recordId: String,
  params: {},
  sentTo: String,
  sentBcc: String,
  sentDate: Date,
  status: String,
  errorMessage: String,
  emailId: String
});

EmailSchema.index({ realmId: 1, 'params.term': 1 });
EmailSchema.index({ realmId: 1, recordId: 1 });

export default mongoose.model<CollectionTypes.Email>('Email', EmailSchema);
