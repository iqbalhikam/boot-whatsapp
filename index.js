const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const axios = require('axios');
const { getJson } = require('serpapi');
const OpenAI = require('openai');
const { log } = require('console');
const env = require('dotenv');
env.config();
const apiKeys = [
  process.env.APIKEY,
  process.env.APIKEY1,
  process.env.APIKEY2,
  process.env.APIKEY3,
  // Add more API keys if needed
];

let currentApiKeyIndex = 0;

const getNextApiKey = () => {
  const currentApiKey = apiKeys[currentApiKeyIndex];
  currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
  return currentApiKey;
};

const openai = new OpenAI({ apiKey: getNextApiKey() });

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

    // console.log(pesan);
    if (pesan.startsWith('/iq ')) {
      getJson(
        {
          q: pesan,
          location: 'Indonesia',
          hl: 'id',
          gl: 'id',
          google_domain: 'google.co.id',
          api_key: process.env.GOOGLE_APIKEY,
        },
        async (json) => {
          console.log(json.inline_images_suggested_searches);
          if (json.inline_images_suggested_searches && json.inline_images_suggested_searches.length > 0) {
            let message = 'Hasil pencarian:\n';
            for (const item of json.inline_images_suggested_searches) {
              message += `Nama: ${item.name}\nLink: ${item.link}\nThumbnail: ${item.thumbnail}\n\n`;
            }
            await sock.sendMessage(chat.key.remoteJid, { text: message }, { quoted: chat });
          } else {
            console.error('Tidak ada data yang ditemukan dalam respons JSON');
            await sock.sendMessage(chat.key.remoteJid, { text: 'Tidak ada data yang ditemukan dalam respons JSON' }, { quoted: chat });
            // Handle the case where no data is found in the JSON response
          }
          // // Process the mapped data further or send it as a message
          // await sock.sendMessage(chat.key.remoteJid, { text: '' }, { quoted: chat });
          // } else {
          // console.error('No data found in JSON response');
          // Handle the case where no data is found in the JSON response
        }
      );
    } else if (pesan.startsWith('.iq ')) {
      try {
        const completion = await openai.chat.completions.create({
          messages: [{ role: 'user', content: pesan }],
          model: 'gpt-3.5-turbo',
          // max_tokens: 40000,
        });
        var res = completion.choices[0].message.content;
      } catch (error) {
        console.error(error);
        res = 'error, token habis';
      }

      console.log(res);
      await sock.sendMessage(chat.key.remoteJid, { text: res }, { quoted: chat });
    } else if (pesan.startsWith('.img ')) {
      const response = openai.images.generate({
        model: 'dall-e-3',
        prompt: pesan,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      });

      const image_url = response.data[0].url;
      console.log(image_url);
      await sock.sendMessage(id, {
        video: image_url,
        caption: 'hello!',
        gifPlayback: true,
      });
    }
  });
};
connectWhatsapp();
