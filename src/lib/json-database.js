// JSON verilerini import et (build-time'da oluşacak)
let participantsData = [];

// Dynamic import ile JSON'u yükle
async function loadJSONData() {
  if (participantsData.length === 0) {
    try {
      // Vercel'de bu şekilde import edebiliriz
      const data = await import('../app/data/participants.json');
      participantsData = data.default || [];
      console.log(`✅ Loaded ${participantsData.length} records from JSON database`);
    } catch (error) {
      console.error('❌ Failed to load JSON data:', error);
      participantsData = [];
    }
  }
  return participantsData;
}

export class JSONDatabase {
  constructor() {
    this.data = [];
    this.endpointIndex = {};
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      this.data = await loadJSONData();
      this.buildIndex();
      this.initialized = true;
    }
  }

  buildIndex() {
    // Endpoint ID'ye göre index oluştur
    this.endpointIndex = {};
    this.data.forEach(participant => {
      const endpointKey = participant.endpoint_id.toLowerCase();
      if (!this.endpointIndex[endpointKey]) {
        this.endpointIndex[endpointKey] = [];
      }
      this.endpointIndex[endpointKey].push(participant);
    });
  }

  // Full PID ile ara
  async findByFullPid(fullPid) {
    await this.initialize();
    return this.data.find(p => p.full_pid === fullPid);
  }

  // Endpoint ID ile ara
  async findByEndpointId(endpointId) {
    await this.initialize();
    const key = endpointId.toLowerCase();
    return this.endpointIndex[key] || [];
  }

  // Scheme ve Endpoint ID ile ara
  async findBySchemeAndEndpoint(schemeId, endpointId) {
    const fullPid = `${schemeId}:${endpointId}`;
    return this.findByFullPid(fullPid);
  }

  // Tüm veriyi getir
  async getAllData() {
    await this.initialize();
    return this.data;
  }
}

// Singleton instance
let jsonDB = null;

export function getJSONDatabase() {
  if (!jsonDB) {
    jsonDB = new JSONDatabase();
  }
  return jsonDB;
}