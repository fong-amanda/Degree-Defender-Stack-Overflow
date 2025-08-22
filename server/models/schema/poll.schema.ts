import { Schema } from 'mongoose';

const pollSchema: Schema = new Schema(
  {
    question: {
      type: String,
      required: true,
    },
    choices: [
      {
        choice: {
          type: String,
          required: true,
        },
        votes: {
          type: Number,
          default: 0,
        },
      },
    ],
    // createdBy: {
    //   type: String,
    //   required: true,
    // },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    communityId: {
      type: Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
    },
    voters: [
      {
        type: String,
      },
    ],
  },
  { collection: 'Poll' },
);

export default pollSchema;
