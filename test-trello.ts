const API_KEY = process.env.TRELLO_API_KEY;
const TOKEN = process.env.TRELLO_TOKEN;
const BOARD_ID = 'Ui5PCcsL';

if (!API_KEY || !TOKEN) {
	console.error('❌ TRELLO_API_KEY atau TRELLO_TOKEN tidak ditemukan di .env.local');
	process.exit(1);
}

console.log('🔍 Mengambil daftar list dari board Trello...\n');

const res = await fetch(
	`https://api.trello.com/1/boards/${BOARD_ID}/lists?key=${API_KEY}&token=${TOKEN}`,
	{ headers: { Accept: 'application/json' } }
);

if (!res.ok) {
	console.error(`❌ Error ${res.status}: ${await res.text()}`);
	process.exit(1);
}

const lists = (await res.json()) as { id: string; name: string }[];

console.log('✅ Daftar list di board "mini-issue":\n');
console.log('─'.repeat(50));
for (const list of lists) {
	console.log(`📋 ${list.name}`);
	console.log(`   ID: ${list.id}`);
	console.log('');
}
console.log('─'.repeat(50));
console.log('\n💡 Salin ID list yang diinginkan ke TRELLO_LIST_ID di .env.local');
