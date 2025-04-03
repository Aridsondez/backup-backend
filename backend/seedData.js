const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://COP4331:NfRRUet8PomqvOtH@poosd-large-project.ujyws.mongodb.net/?retryWrites=true&w=majority&appName=POOSD-Large-Project"; 
const client = new MongoClient(uri);

const categories = {
  Greetings: [
    ["hello", "hola"],
    ["goodbye", "adiós"],
    ["how are you?", "¿cómo estás?"],
    ["nice to meet you", "mucho gusto"],
    ["good morning", "buenos días"],
  ],
  Food: [
    ["apple", "manzana"],
    ["bread", "pan"],
    ["water", "agua"],
    ["cheese", "queso"],
    ["coffee", "café"],
  ],
  Travel: [
    ["ticket", "boleto"],
    ["airport", "aeropuerto"],
    ["hotel", "hotel"],
    ["map", "mapa"],
    ["bus", "autobús"],
  ],
};

async function seed() {
  try {
    await client.connect();
    const db = client.db("POOSD");
    const Words = db.collection("Words");
    const VocabTemplates = db.collection("VocabList");
    const Users = db.collection("Users");

    await Words.deleteMany({});
    await VocabTemplates.deleteMany({});

    let wordCounter = 1;
    const allWords = [];
    const vocabLists = [];

    // Insert words
    for (const [topic, pairs] of Object.entries(categories)) {
      const wordIds = [];
      for (const [eng, esp] of pairs) {
        const wordId = `word${wordCounter++}`;
        const word = {
          WordId: wordId,
          English: eng,
          Spanish: esp,
          Topic: topic,
        };
        wordIds.push(wordId);
        await Words.insertOne(word);
      }

      // Create vocab list for that topic
      const vocabList = {
        VocabListId: `vocablist_${topic.toLowerCase()}`,
        Category: topic,
        Words: wordIds,
      };
      vocabLists.push(vocabList);
      await VocabTemplates.insertOne(vocabList);
    }

    // Assign vocab lists to all users
    const users = await Users.find({}).toArray();
    for (const user of users) {
      await Users.updateOne(
        { UserId: user.UserId },
        { $set: { VocabLists: vocabLists } }
      );
    }

    console.log("✅ Words and vocab lists added. All users updated.");
  } catch (err) {
    console.error("❌ Error seeding data:", err);
  } finally {
    await client.close();
  }
}

seed();
