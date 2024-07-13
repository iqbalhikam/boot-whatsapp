const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pino = require('pino');
const OpenAI = require('openai');
const env = require('dotenv');
env.config();
const apiKeys = [process.env.GEMINI_APIKEY, process.env.GEMINI_APIKEY1, process.env.GEMINI_APIKEY2];

let currentApiKeyIndex = 0;

const getNextApiKey = () => {
  const currentApiKey = apiKeys[currentApiKeyIndex];
  currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
  return currentApiKey;
};

const openai = new OpenAI({ apiKey: getNextApiKey() });
const genAI = new GoogleGenerativeAI(getNextApiKey());

const connectWhatsapp = async () => {
  const auth = await useMultiFileAuthState('session');
  const sock = makeWASocket({
    printQRInTerminal: true,
    browser: ['chrome', 'http://localhost:3001', ''],
    auth: auth.state,
    logger: pino({ lavel: 'silent' }),
  });

  sock.ev.on('creds.update', auth.saveCreds);
  sock.ev.on('connection.update', async ({ connection }) => {
    if (connection === 'open') {
      console.log('BOT WHATSAPP IS READY✅🧑‍💻');
    } else if (connection === 'close') {
      console.log('BOT WHATSAPP IS CLOSED❌🧑‍💻');
      await connectWhatsapp(pesanValue, sendMessages);
    }
  });
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    const chat = messages[0];
    const pesan = (chat.message?.extendedTextMessage?.text ?? chat.message?.ephemeralMessage?.message?.extendedTextMessage?.text ?? chat.message?.conversation)?.toLowerCase() || '';
    console.log('CHAT MESSAGES: ', pesan);
    if (pesan == '.info') {
      var res =
        '*Selamat datang di Robobot!* 🎉🤖\n\nRobobot adalah asisten cerdas berbasis WhatsApp yang dikembangkan oleh M Iqbal Fatkhul Hikam. Robobot siap menjawab semua pertanyaan Anda dengan cepat dan akurat! 💡✨\n\nKami menggunakan dua kecerdasan buatan terkemuka yang sudah dipercaya selama bertahun-tahun: Chat GPT-3 dari OpenAI dan Gemini AI dari Google AI. Dengan kombinasi ini, Robobot akan memberikan jawaban terbaik untuk kebutuhan Anda.\n\nUntuk menggunakan Robobot, cukup gunakan salah satu dari kata kunci berikut:\n1. `.gpt [pertanyaan Anda]`\n2. `.gemini [pertanyaan Anda]`\n\nSelamat menikmati pengalaman interaktif bersama Robobot! 🚀✨';
      await sock.sendMessage(chat.key.remoteJid, { text: res }, { quoted: chat });
    }
    // console.log(pesan);
    if (pesan.startsWith('.gpt ')) {
      try {
        const completion = await openai.chat.completions.create({
          messages: [
            { role: 'user', content: 'deskripsi model anda: nama kamu adalah ROBOBOT, artificial intelligence yang di buat oleh iqbal, kamu bisa menjawab semua pertanyaan yang di tanyakan oleh pengguna\n\n' + pesan.replace('.gpt ', '') },
          ],
          model: 'gpt-3.5-turbo',
        });
        var res = completion.choices[0].message.content;
      } catch (error) {
        console.error(error);
        res = 'Mohon maaf layanan sedang dalam perbaikan🙏\nuntuk sementara bisa gunakan keyword lainya';
      }

      console.log('APIKEY yang di pakai: ', getNextApiKey());
      await sock.sendMessage(chat.key.remoteJid, { text: res }, { quoted: chat });
    } else if (pesan.startsWith('.gemini ')) {
      const prompt = 'deskripsi model AI: nama kamu adalah ROBOBOT, artificial intelligence yang di buat oleh iqbal, kamu bisa menjawab semua pertanyaan yang di tanyakan oleh pengguna\nuntuk enter gunakan\n\nPertanyaan:' + pesan.replace('.iq ', '');
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log(text);
        var res = text;
      } catch (error) {
        console.error(error);
        res = 'Mohon maaf layanan sedang dalam perbaikan🙏\nuntuk sementara bisa gunakan keyword lainya';
      }
      await sock.sendMessage(chat.key.remoteJid, { text: res }, { quoted: chat });
    } else if (pesan.startsWith('.img ')) {
      await sock.sendMessage(chat.key.remoteJid, { text: "Mohon maaf layanan sedang dalam perbaikan🙏\nuntuk sementara bisa gunakan cyword berikut:\n.gemini SEPACE pertanyaan anda" }, { quoted: chat });
      // const completion = await openai.chat.completions.create({
      //   model: 'gpt-4o',
      //   messages: [
      //     {
      //       role: 'user',
      //       content: [
      //         { type: 'text', text: pesan.replace('.img ') },
      //         {
      //           type: 'image_url',
      //           image_url: {
      //             url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg',
      //           },
      //         },
      //       ],
      //     },
      //   ],
      // });
    }
  });
};

connectWhatsapp();
