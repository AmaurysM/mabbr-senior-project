import { MongoClient } from 'mongodb';

async function fixScratchTickets() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error('DATABASE_URL environment variable is not set');
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('MABBR');
    const collection = db.collection('user_scratch_ticket');

    // Find all tickets with null dayKey
    const tickets = await collection.find({ dayKey: null }).toArray();
    console.log(`Found ${tickets.length} tickets with null dayKey`);

    // Update each ticket with a default dayKey
    for (const ticket of tickets) {
      const defaultDayKey = new Date(ticket.createdAt).toISOString().split('T')[0];
      await collection.updateOne(
        { _id: ticket._id },
        { $set: { dayKey: defaultDayKey } }
      );
      console.log(`Updated ticket ${ticket._id} with dayKey ${defaultDayKey}`);
    }

    console.log('Successfully updated all tickets');
  } catch (error) {
    console.error('Error fixing scratch tickets:', error);
  } finally {
    await client.close();
  }
}

fixScratchTickets(); 