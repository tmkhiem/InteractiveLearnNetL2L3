const speedDurations = {
  slow: 2200,
  normal: 1400,
  fast: 800
};

const lessons = [
  { id: 'lesson-1', title: 'Lesson 1: Layer 2 Network Introduction', range: [0, 8] },
  { id: 'lesson-2', title: 'Lesson 2: Introducing Layer 3', range: [9, 10] },
  { id: 'lesson-3', title: 'Lesson 3: Local Delivery Using ARP', range: [11, 17] },
  { id: 'lesson-4', title: 'Lesson 4: Introducing the Router', range: [18, 19] },
  { id: 'lesson-5', title: 'Lesson 5: Sending to an External Network', range: [20, 22] },
  { id: 'lesson-6', title: 'Lesson 6: Router Processing and Re-Encapsulation', range: [23, 25] }
];

const positions = {
  pc1: { x: 80, y: 60 },
  pc2: { x: 80, y: 210 },
  pc3: { x: 80, y: 360 },
  sw1: { x: 360, y: 210 },
  r1: { x: 590, y: 210 },
  ext1: { x: 760, y: 60 }
};

const topology = {
  pcs: [
    {
      id: 'pc1',
      displayName: 'PC-1',
      nics: [
        {
          id: 'pc1-nic1',
          macAddress: '00:11:22:33:44:11',
          ipAddress: '192.168.1.10',
          prefix: '/24',
          connectedLink: 'l-pc1-sw1'
        }
      ],
      arpTable: [{ ipAddress: '192.168.1.20', macAddress: '00:11:22:33:44:22' }],
      routingTable: [
        { destinationNetwork: '192.168.1.0/24', nextHopIp: '-', outgoingInterface: 'pc1-nic1' },
        { destinationNetwork: '0.0.0.0/0', nextHopIp: '192.168.1.1', outgoingInterface: 'pc1-nic1' }
      ],
      position: positions.pc1
    },
    {
      id: 'pc2',
      displayName: 'PC-2',
      nics: [
        {
          id: 'pc2-nic1',
          macAddress: '00:11:22:33:44:22',
          ipAddress: '192.168.1.20',
          prefix: '/24',
          connectedLink: 'l-pc2-sw1'
        }
      ],
      arpTable: [],
      routingTable: [
        { destinationNetwork: '192.168.1.0/24', nextHopIp: '-', outgoingInterface: 'pc2-nic1' },
        { destinationNetwork: '0.0.0.0/0', nextHopIp: '192.168.1.1', outgoingInterface: 'pc2-nic1' }
      ],
      position: positions.pc2
    },
    {
      id: 'pc3',
      displayName: 'PC-3',
      nics: [
        {
          id: 'pc3-nic1',
          macAddress: '00:11:22:33:44:33',
          ipAddress: '192.168.1.30',
          prefix: '/24',
          connectedLink: 'l-pc3-sw1'
        }
      ],
      arpTable: [],
      routingTable: [
        { destinationNetwork: '192.168.1.0/24', nextHopIp: '-', outgoingInterface: 'pc3-nic1' },
        { destinationNetwork: '0.0.0.0/0', nextHopIp: '192.168.1.1', outgoingInterface: 'pc3-nic1' }
      ],
      position: positions.pc3
    }
  ],
  switches: [
    {
      id: 'sw1',
      displayName: 'SW-1 (Layer 2 Switch)',
      ports: ['p1', 'p2', 'p3', 'p4'],
      position: positions.sw1
    }
  ],
  routers: [
    {
      id: 'r1',
      displayName: 'R1 (Layer 3 Router)',
      nics: [
        {
          id: 'r1-local',
          macAddress: 'aa:bb:cc:00:00:01',
          ipAddress: '192.168.1.1',
          prefix: '/24',
          connectedLink: 'l-sw1-r1'
        },
        {
          id: 'r1-external',
          macAddress: 'aa:bb:cc:00:00:02',
          ipAddress: '203.0.113.1',
          prefix: '/24',
          connectedLink: 'l-r1-ext'
        }
      ],
      arpTable: [],
      routingTable: [
        { destinationNetwork: '192.168.1.0/24', nextHopIp: '-', outgoingInterface: 'r1-local' },
        { destinationNetwork: '203.0.113.0/24', nextHopIp: '-', outgoingInterface: 'r1-external' },
        { destinationNetwork: '0.0.0.0/0', nextHopIp: '203.0.113.254', outgoingInterface: 'r1-external' }
      ],
      position: positions.r1
    }
  ],
  externalHosts: [
    {
      id: 'ext1',
      displayName: 'External Host',
      nics: [
        {
          id: 'ext1-nic1',
          macAddress: 'de:ad:be:ef:00:88',
          ipAddress: '203.0.113.88',
          prefix: '/24',
          connectedLink: 'l-r1-ext'
        }
      ],
      position: positions.ext1
    }
  ],
  links: [
    { id: 'l-pc1-sw1', endpointA: 'pc1', endpointB: 'sw1', visualPath: ['pc1', 'sw1'] },
    { id: 'l-pc2-sw1', endpointA: 'pc2', endpointB: 'sw1', visualPath: ['pc2', 'sw1'] },
    { id: 'l-pc3-sw1', endpointA: 'pc3', endpointB: 'sw1', visualPath: ['pc3', 'sw1'] },
    { id: 'l-sw1-r1', endpointA: 'sw1', endpointB: 'r1', visualPath: ['sw1', 'r1'] },
    { id: 'l-r1-ext', endpointA: 'r1', endpointB: 'ext1', visualPath: ['r1', 'ext1'] }
  ]
};

const entityMap = new Map();
let entityElements = new Map();
let currentStep = 0;
let playing = false;
let paused = false;
let showIp = false;
let selectedLesson = 0;
let arpRequester = 'pc1';
let arpTarget = 'pc3';

const linkLayer = document.getElementById('linkLayer');
const entitiesLayer = document.getElementById('entitiesLayer');
const tokenLayer = document.getElementById('tokenLayer');
const lessonTitle = document.getElementById('lessonTitle');
const stepTitle = document.getElementById('stepTitle');
const stepText = document.getElementById('stepText');
const tableDeviceSelect = document.getElementById('tableDeviceSelect');
const arpBody = document.querySelector('#arpTable tbody');
const routeBody = document.querySelector('#routingTable tbody');
const speedSelect = document.getElementById('speedSelect');

function cloneTopology() {
  return JSON.parse(JSON.stringify(topology));
}

let state = cloneTopology();

function setEntityMap() {
  entityMap.clear();
  [...state.pcs, ...state.switches, ...state.routers, ...state.externalHosts].forEach((item) => {
    entityMap.set(item.id, item);
  });
}

function createEntityCard(entity, kind) {
  const card = document.createElement('article');
  card.className = `entity ${kind}`;
  card.id = `entity-${entity.id}`;
  card.style.left = `${entity.position.x}px`;
  card.style.top = `${entity.position.y}px`;
  card.innerHTML = `<h3>${entity.displayName}</h3>`;
  entitiesLayer.appendChild(card);
  return card;
}

function renderEntities() {
  entitiesLayer.innerHTML = '';
  entityElements.clear();

  state.pcs.forEach((pc) => entityElements.set(pc.id, createEntityCard(pc, 'pc')));
  state.switches.forEach((sw) => entityElements.set(sw.id, createEntityCard(sw, 'switch')));
  state.routers.forEach((r) => entityElements.set(r.id, createEntityCard(r, 'router')));
  state.externalHosts.forEach((h) => entityElements.set(h.id, createEntityCard(h, 'external')));
  refreshEntityText();
}

function getNodeCenter(id) {
  const point = positions[id];
  return { x: point.x + 65, y: point.y + 42 };
}

function drawLinks() {
  linkLayer.innerHTML = '';
  state.links.forEach((link) => {
    const a = getNodeCenter(link.endpointA);
    const b = getNodeCenter(link.endpointB);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', a.x);
    line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x);
    line.setAttribute('y2', b.y);
    line.setAttribute('stroke', '#4267b2');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-linecap', 'round');
    line.dataset.linkId = link.id;
    linkLayer.appendChild(line);
  });
}

function refreshEntityText() {
  for (const [id, card] of entityElements.entries()) {
    const model = entityMap.get(id);
    let info = '';

    if (model.nics) {
      model.nics.forEach((nic) => {
        info += `<span class="label">MAC: ${nic.macAddress}</span>`;
        if (showIp && nic.ipAddress) {
          info += `<span class="label">IP: ${nic.ipAddress}${nic.prefix || ''}</span>`;
        }
      });
    }

    if (model.ports) {
      info += `<span class="label">Ports: ${model.ports.join(', ')}</span>`;
      info += '<span class="label">Forwards by destination MAC only</span>';
    }

    if (!info) {
      info = '<span class="label">No NIC data</span>';
    }

    card.innerHTML = `<h3>${model.displayName}</h3>${info}`;
  }
}

function setVisibility(visibleIds) {
  entityElements.forEach((el, id) => {
    el.classList.toggle('hidden', !visibleIds.includes(id));
  });
  Array.from(linkLayer.querySelectorAll('line')).forEach((line) => {
    const link = state.links.find((item) => item.id === line.dataset.linkId);
    const visible = visibleIds.includes(link.endpointA) && visibleIds.includes(link.endpointB);
    line.style.opacity = visible ? '1' : '0';
  });
}

function fillTableRows(tbody, rows, cols) {
  tbody.innerHTML = '';
  if (!rows || rows.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="${cols}">Empty</td>`;
    tbody.appendChild(tr);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    if (cols === 2) {
      tr.innerHTML = `<td>${row.ipAddress}</td><td>${row.macAddress}</td>`;
    } else {
      tr.innerHTML = `<td>${row.destinationNetwork}</td><td>${row.nextHopIp}</td><td>${row.outgoingInterface}</td>`;
    }
    tbody.appendChild(tr);
  });
}

function updateTables() {
  const id = tableDeviceSelect.value;
  const device = entityMap.get(id);
  fillTableRows(arpBody, device?.arpTable || [], 2);
  fillTableRows(routeBody, device?.routingTable || [], 3);
}

function populateTableDeviceSelect() {
  tableDeviceSelect.innerHTML = '';
  [...state.pcs, ...state.routers].forEach((d) => {
    const option = document.createElement('option');
    option.value = d.id;
    option.textContent = d.displayName;
    tableDeviceSelect.appendChild(option);
  });
  tableDeviceSelect.value = state.pcs[0].id;
  updateTables();
}

async function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitIfPaused() {
  while (paused) {
    await waitMs(100);
  }
}

function getSpeedDuration(multiplier = 1) {
  return speedDurations[speedSelect.value] * multiplier;
}

async function animateToken(pathIds, label, multiplier = 1) {
  const token = document.createElement('div');
  token.className = 'token';
  token.textContent = label;
  tokenLayer.appendChild(token);

  const points = pathIds.map(getNodeCenter);
  if (points.length === 0) {
    token.remove();
    return;
  }
  const segmentDuration = getSpeedDuration(multiplier) / Math.max(points.length - 1, 1);

  token.style.left = `${points[0].x}px`;
  token.style.top = `${points[0].y}px`;

  for (let i = 1; i < points.length; i += 1) {
    await waitIfPaused();
    token.style.transition = `left ${segmentDuration}ms linear, top ${segmentDuration}ms linear`;
    token.style.left = `${points[i].x}px`;
    token.style.top = `${points[i].y}px`;
    await waitMs(segmentDuration + 20);
  }

  await waitMs(200);
  token.remove();
}

function setExplanation(lesson, title, text) {
  lessonTitle.textContent = lesson;
  stepTitle.textContent = title;
  stepText.innerHTML = text;
}

function getPc(id) {
  return state.pcs.find((pc) => pc.id === id);
}

function getRouter() {
  return state.routers[0];
}

function clearAllPcArp() {
  state.pcs.forEach((pc) => { pc.arpTable = []; });
}

function setArpEntry(pcId, ipAddress, macAddress) {
  const pc = getPc(pcId);
  if (!pc) return;
  const existing = pc.arpTable.find((e) => e.ipAddress === ipAddress);
  if (existing) {
    existing.macAddress = macAddress;
  } else {
    pc.arpTable.push({ ipAddress, macAddress });
  }
}

const steps = [
  {
    lesson: lessons[0].title,
    title: 'L2-001: Initial network fade-in',
    text: 'Three PCs and one switch appear as the Layer 2-only local network.',
    setup: () => { showIp = false; setVisibility(['pc1', 'pc2', 'pc3', 'sw1']); refreshEntityText(); },
    animation: () => waitMs(400)
  },
  {
    lesson: lessons[0].title,
    title: 'L2-002: Unique MAC addresses',
    text: 'Each PC shows its NIC MAC address. Every NIC has one unique MAC address.',
    setup: () => { refreshEntityText(); }
  },
  {
    lesson: lessons[0].title,
    title: 'L2-003: Layer 2 frame creation',
    text: 'PC-1 creates a Layer 2 frame with source MAC, destination MAC, and payload placeholder.',
    animation: () => animateToken(['pc1'], 'Frame: SrcMAC=11, DstMAC=22, Payload=...')
  },
  {
    lesson: lessons[0].title,
    title: 'L2-004: Layer 2 addressing',
    text: 'At Layer 2, the destination MAC identifies where the frame should be delivered next.'
  },
  {
    lesson: lessons[0].title,
    title: 'L2-005: Point-to-point Layer 2 delivery',
    text: 'The frame travels PC-1 ➜ SW-1 ➜ PC-2.',
    animation: () => animateToken(['pc1', 'sw1', 'pc2'], 'L2 Frame to PC-2')
  },
  {
    lesson: lessons[0].title,
    title: 'L2-006: Broadcast and multicast demonstration',
    text: 'Broadcast reaches all PCs. Multicast reaches a selected subset of PCs.',
    animation: async () => {
      await animateToken(['pc1', 'sw1', 'pc2'], 'Broadcast FF:FF:FF:FF:FF:FF', 0.8);
      await animateToken(['pc1', 'sw1', 'pc3'], 'Broadcast FF:FF:FF:FF:FF:FF', 0.8);
      await animateToken(['pc2', 'sw1', 'pc1'], 'Multicast 01:00:5E:00:00:01', 0.8);
      await animateToken(['pc2', 'sw1', 'pc3'], 'Multicast 01:00:5E:00:00:01', 0.8);
    }
  },
  {
    lesson: lessons[0].title,
    title: 'L2-007: Switch is Layer 2 only',
    text: 'SW-1 inspects only destination MAC. It does not inspect Layer 3 information.'
  },
  {
    lesson: lessons[0].title,
    title: 'L2-008: Switch forwarding by destination MAC',
    text: 'SW-1 forwards based on destination MAC to the correct outgoing port.',
    animation: () => animateToken(['pc3', 'sw1', 'pc2'], 'Forward by Dst MAC=22')
  },
  {
    lesson: lessons[0].title,
    title: 'L2-009: End of Layer 2 section',
    text: '<span class="note">Layer 2-only section complete.</span> Layer 3 will be introduced next.'
  },
  {
    lesson: lessons[1].title,
    title: 'L3-001/L3-002: Zoom out and show IP addresses',
    text: 'The view expands to the full visible network. IP addresses are now displayed alongside MAC addresses.',
    setup: () => {
      showIp = true;
      setVisibility(['pc1', 'pc2', 'pc3', 'sw1', 'r1', 'ext1']);
      refreshEntityText();
    }
  },
  {
    lesson: lessons[1].title,
    title: 'L3-003/L3-004: Packet creation and encapsulation',
    text: 'PC-1 forms a Layer 3 packet (SrcIP 192.168.1.10, DstIP 192.168.1.20) inside a Layer 2 frame payload.',
    animation: () => animateToken(['pc1'], 'L2 Frame [ L3 Packet SrcIP=10, DstIP=20 ]')
  },
  {
    lesson: lessons[2].title,
    title: 'ARP-001/ARP-002/ARP-003: Local check and ARP lookup',
    text: 'PC-1 checks destination IP as local, looks in ARP table, and completes frame with Src MAC=PC-1, Dst MAC=PC-2.',
    setup: () => {
      setArpEntry('pc1', '192.168.1.20', '00:11:22:33:44:22');
      updateTables();
    }
  },
  {
    lesson: lessons[2].title,
    title: 'ARP-004/ARP-005: Local packet travel and decapsulation',
    text: 'Frame travels via switch to PC-2, then PC-2 decapsulates: remove L2 frame and reveal L3 packet.',
    animation: async () => {
      await animateToken(['pc1', 'sw1', 'pc2'], 'Frame DstMAC=22, Payload=L3 Packet');
      await animateToken(['pc2'], 'Decapsulation: remove L2, reveal L3', 0.8);
    }
  },
  {
    lesson: lessons[2].title,
    title: 'ARP-006: Empty ARP tables',
    text: 'Initial ARP-learning example starts with empty ARP tables on all three PCs.',
    setup: () => {
      clearAllPcArp();
      updateTables();
    }
  },
  {
    lesson: lessons[2].title,
    title: 'ARP-007/ARP-008/ARP-009: ARP request, ARP reply, ARP learning',
    text: 'Random source sends ARP request: “Who has this IP? Reply to me.” Owner replies with MAC. Source updates ARP table. ARP is treated as Layer 2 in this lesson.',
    setup: () => {
      const pairPool = [
        ['pc1', 'pc2'],
        ['pc2', 'pc3'],
        ['pc3', 'pc1']
      ];
      const selectedPair = pairPool[Math.floor(Math.random() * pairPool.length)];
      arpRequester = selectedPair[0];
      arpTarget = selectedPair[1];
    },
    animation: async () => {
      await animateToken([arpRequester, 'sw1', arpTarget], 'ARP Request: Who has this IP? Reply to me.', 0.9);
      await animateToken([arpTarget, 'sw1', arpRequester], 'ARP Reply: IP is at this MAC', 0.9);
      const targetNic = getPc(arpTarget).nics[0];
      setArpEntry(arpRequester, targetNic.ipAddress, targetNic.macAddress);
      updateTables();
    }
  },
  {
    lesson: lessons[2].title,
    title: 'ARP-010: Repeat local delivery (1)',
    text: 'Repeat #1 reinforces ARP lookup, Layer 2 encapsulation, switch forwarding, and decapsulation.',
    animation: () => animateToken([arpRequester, 'sw1', arpTarget], 'Repeated local delivery #1', 0.85)
  },
  {
    lesson: lessons[2].title,
    title: 'ARP-010: Repeat local delivery (2)',
    text: 'Repeat #2 reinforces ARP table usage and Layer 3 packet delivery inside Layer 2 frame.',
    animation: () => animateToken([arpRequester, 'sw1', arpTarget], 'Repeated local delivery #2', 0.85)
  },
  {
    lesson: lessons[2].title,
    title: 'ARP-010: Repeat local delivery (3)',
    text: 'Repeat #3 completes reinforcement of local ARP-based delivery behavior.',
    animation: () => animateToken([arpRequester, 'sw1', arpTarget], 'Repeated local delivery #3', 0.85)
  },
  {
    lesson: lessons[3].title,
    title: 'RTR-001: Router introduction',
    text: 'R1 is introduced with two NICs: one local-side NIC to SW-1 and one external-side NIC toward another network.',
    setup: () => {
      setVisibility(['pc1', 'pc2', 'pc3', 'sw1', 'r1', 'ext1']);
      refreshEntityText();
    }
  },
  {
    lesson: lessons[3].title,
    title: 'RTR-002/RTR-003: Router MAC discovery and fast-forward ARP state',
    text: 'A PC ARPs for router local NIC MAC, then simulation fast-forwards to all PCs knowing router local IP/MAC.',
    setup: () => {
      const routerNic = getRouter().nics[0];
      state.pcs.forEach((pc) => setArpEntry(pc.id, routerNic.ipAddress, routerNic.macAddress));
      updateTables();
    },
    animation: () => animateToken(['pc1', 'sw1', 'r1'], 'ARP for default gateway MAC', 0.9)
  },
  {
    lesson: lessons[4].title,
    title: 'EXT-001/EXT-002/EXT-003: Ping external and subnet check',
    text: 'PC-1 sends ping payload to 203.0.113.88. Subnet check says destination is not local.',
    animation: () => animateToken(['pc1'], 'L3 Packet SrcIP=192.168.1.10 DstIP=203.0.113.88')
  },
  {
    lesson: lessons[4].title,
    title: 'EXT-004/EXT-005: Default gateway and ARP lookup',
    text: 'PC-1 routing table selects default gateway 192.168.1.1 and ARP table provides router local MAC.',
    setup: () => updateTables()
  },
  {
    lesson: lessons[4].title,
    title: 'EXT-006/EXT-007: Encapsulation for router delivery',
    text: 'L2 destination is router MAC, but L3 destination remains external host IP. Router exists to forward packets to other networks.',
    animation: () => animateToken(['pc1', 'sw1', 'r1'], 'L2 Dst=RouterMAC | L3 Dst=203.0.113.88')
  },
  {
    lesson: lessons[5].title,
    title: 'ROUTE-001/002/003/004: Router receive, decapsulate, route lookup',
    text: 'Router receives frame by MAC match, removes Layer 2 frame, reads Layer 3 destination IP, and uses routing table.',
    animation: async () => {
      await animateToken(['r1'], 'Router decapsulation', 0.8);
      await animateToken(['r1'], 'Route lookup: send out r1-external', 0.8);
    }
  },
  {
    lesson: lessons[5].title,
    title: 'ROUTE-005/ROUTE-006/ROUTE-007: Re-encapsulation rules',
    text: 'Router re-encapsulates same L3 packet (IPs unchanged). New outbound L2 frame has new MAC addresses for next link.',
    animation: () => animateToken(['r1'], 'New L2 frame, same L3 Src/Dst IPs', 0.85)
  },
  {
    lesson: lessons[5].title,
    title: 'ROUTE-008: Send toward next hop',
    text: 'Router sends new frame out external NIC. Each routed hop changes Layer 2 frame while preserving Layer 3 destination.',
    animation: () => animateToken(['r1', 'ext1'], 'Outbound frame toward next hop')
  }
];

function findLessonIndexForStep(stepIndex) {
  return lessons.findIndex((lesson) => stepIndex >= lesson.range[0] && stepIndex <= lesson.range[1]);
}

async function executeStep(index, withAnimation = true) {
  if (index < 0 || index >= steps.length) return;
  const step = steps[index];
  selectedLesson = findLessonIndexForStep(index);
  setExplanation(step.lesson, step.title, step.text);
  step.setup?.();
  setEntityMap();
  refreshEntityText();
  updateTables();
  if (withAnimation && step.animation) {
    await step.animation();
  }
}

async function playFromCurrent() {
  if (playing) return;
  playing = true;
  paused = false;
  while (playing && currentStep < steps.length) {
    await waitIfPaused();
    await executeStep(currentStep, true);
    currentStep += 1;
    if (currentStep >= steps.length) {
      playing = false;
      break;
    }
    await waitMs(Math.max(250, getSpeedDuration(0.22)));
  }
}

function resetSimulation() {
  playing = false;
  paused = false;
  currentStep = 0;
  showIp = false;
  state = cloneTopology();
  setEntityMap();
  renderEntities();
  drawLinks();
  setVisibility(['pc1', 'pc2', 'pc3', 'sw1']);
  populateTableDeviceSelect();
  setExplanation('-', '-', 'Press Start to begin the lesson sequence.');
}

async function stepForward() {
  if (playing || currentStep >= steps.length) return;
  await executeStep(currentStep, true);
  currentStep += 1;
}

async function seekLesson(delta) {
  const target = Math.max(0, Math.min(lessons.length - 1, selectedLesson + delta));
  if (target === selectedLesson) return;

  playing = false;
  paused = false;
  resetSimulation();

  const targetStep = lessons[target].range[0];
  for (let i = 0; i <= targetStep; i += 1) {
    await executeStep(i, false);
  }
  currentStep = targetStep + 1;
  selectedLesson = target;
}

function bindControls() {
  document.getElementById('startBtn').addEventListener('click', async () => {
    if (currentStep >= steps.length) {
      resetSimulation();
    }
    await playFromCurrent();
  });

  document.getElementById('pauseBtn').addEventListener('click', () => {
    paused = true;
  });

  document.getElementById('resumeBtn').addEventListener('click', async () => {
    if (!playing && currentStep < steps.length) {
      paused = false;
      await playFromCurrent();
      return;
    }
    paused = false;
  });

  document.getElementById('stepBtn').addEventListener('click', stepForward);
  document.getElementById('resetBtn').addEventListener('click', resetSimulation);

  document.getElementById('prevLessonBtn').addEventListener('click', () => seekLesson(-1));
  document.getElementById('nextLessonBtn').addEventListener('click', () => seekLesson(1));

  tableDeviceSelect.addEventListener('change', updateTables);
}

resetSimulation();
bindControls();
