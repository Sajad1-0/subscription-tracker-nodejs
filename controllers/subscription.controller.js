import Subscription from '../models/subscription.model.js';
import { workflowClient } from '../config/upstash.js';
import { SERVER_URL } from '../config/env.js';

export const createSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.create({ ...req.body, user: req.user._id });

    const { workflowRunId } = await workflowClient.trigger({
      url: `${SERVER_URL}/api/workflows/subscription/reminder`,
      body: {
        subscriptionId: subscription.id,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      retries: 0,
    });

    console.log(`Workflow run ID: ${workflowRunId}`);

    res
      .status(201)
      .json({
        success: true,
        message: 'Subscription created successfully',
        data: { subscription, workflowRunId },
      });
  } catch (e) {
    next(e);
  }
};

export const getAllSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find();
    res
      .status(200)
      .json({ success: true, message: 'Subscriptions fetched successfully', data: subscriptions });
  } catch (e) {
    next(e);
  }
};

export const getSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      const error = new Error('Subscription not found');
      error.status = 404;
      throw error;
    }

    res
      .status(200)
      .json({ success: true, message: 'Subscription fetched successfully', data: subscription });
  } catch (e) {
    next(e);
  }
};

export const getUserSubscriptions = async (req, res, next) => {
  try {
    if (req.user.id.toString() !== req.params.id) {
      const error = new Error("You are not authorized to access this account's subscriptions");
      error.status = 401;
      throw error;
    }

    const subscriptions = await Subscription.find({ user: req.params.id });

    res
      .status(200)
      .json({ success: true, message: 'Subscriptions fetched successfully', data: subscriptions });
  } catch (e) {
    next(e);
  }
};
