const express = require('express');
const mongoose = require('mongoose');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Use body parser which we will use to parse request body that sending from the client.
app.use(bodyParser.json());

// We will store our client files in ./client directory.
app.use(express.static(path.join(__dirname, "client")));

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@127.0.0.1:27017/${process.env.DB_NAME}`);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

// Call the async function to connect to MongoDB
connectToMongoDB();

const subscriptionSchema = new mongoose.Schema({
  endpoint: String,
  keys: {
    auth: String,
    p256dh: String,
  },
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

// Your webpush settings
webpush.setVapidDetails(
  'mailto:test@test.com',
  "BEZyIQRsN0dbx9Rri6Lr0O_UOmBd_r1uzpdnmdtXdrMxWuekAri8suhpV2VDuzLSmswNdiJ8l-dvliuOO_dQ1Qc",
  "izdePLR9RAK0xspIDUNMdrg7BKAiUlykYxFfkMu6gEI"
);

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Disconnected from MongoDB');
});

// Gracefully close MongoDB connection on app termination
process.on('SIGINT', () => {
  mongoose.connection.close().then(() => {
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  });
});

// Start the app after a successful database connection
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.post('/subscribe', async (req, res) => {
  const subscription = req.body;

  try {
    // Check if the subscription already exists in the database
    let existingSubscription = await Subscription.findOne({ endpoint: subscription.endpoint });

    if (existingSubscription) {
      // If exists, update the existing subscription
      await Subscription.findOneAndUpdate({ endpoint: subscription.endpoint }, subscription);
      res.status(200).json({ message: 'Subscription updated' });
    } else {
      // If not exists, save the new subscription
      const newSubscription = new Subscription(subscription);
      await newSubscription.save();
      res.status(201).json({ message: 'Subscription created' });
    }
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/send-push-notifications', async (req, res) => {
  try {
    // Fetch all subscriptions from the database
    const subscriptions = await Subscription.find();

    // Check if there are subscriptions
    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'No subscriptions found' });
    }

    // Define the push notification payload
    const payload = JSON.stringify({ title: 'Hello ServerAvatar', body: 'This is a push notification' });

    // Send push notifications to each subscriber
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(subscription, payload);
      } catch (pushError) {
        console.error('Error sending push notification for subscription:', subscription, 'Error:', pushError);
        // Continue with the next subscription even if there's an error
      }
    }

    res.status(200).json({ message: 'Push notifications sent successfully' });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});