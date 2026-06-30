import type {
  MiniMonopolyPlayer,
  MiniMonopolyProperty,
  MiniMonopolyState,
  MiniMonopolyTile,
  MiniMonopolyTileType,
} from "./types";

const AREAS = [
  { name: "minimonopoly.areaRed", color: "#ef5350" },
  { name: "minimonopoly.areaBlue", color: "#42a5f5" },
  { name: "minimonopoly.areaGreen", color: "#66bb6a" },
  { name: "minimonopoly.areaYellow", color: "#ffca28" },
];

const PROPERTY_NAMES = [
  "minimonopoly.propCafe",
  "minimonopoly.propBookstore",
  "minimonopoly.propMarket",
  "minimonopoly.propBakery",
  "minimonopoly.propCinema",
  "minimonopoly.propPharmacy",
  "minimonopoly.propHotel",
  "minimonopoly.propBank",
  "minimonopoly.propMall",
  "minimonopoly.propStation",
  "minimonopoly.propArcade",
  "minimonopoly.propPark",
  "minimonopoly.propGym",
  "minimonopoly.propTheater",
  "minimonopoly.propStudio",
  "minimonopoly.propGallery",
];

const PLAYER_COLORS = ["#ef5350", "#42a5f5", "#66bb6a", "#ffca28"];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function createProperty(areaIndex: number, nameKey: string): MiniMonopolyProperty {
  const base = 120 + areaIndex * 60;
  return {
    name: nameKey,
    area: AREAS[areaIndex].name,
    price: base,
    baseRent: Math.floor(base * 0.3),
    upgradeCost: Math.floor(base * 0.5),
    level: 1,
    ownerId: null,
  };
}

export function generateBoard(): MiniMonopolyTile[] {
  const tileCount = 24;
  const tiles: MiniMonopolyTile[] = [];

  const pattern: MiniMonopolyTileType[] = [
    "start",
    "property",
    "property",
    "chance",
    "property",
    "tax",
    "property",
    "property",
    "chance",
    "property",
    "jail",
    "property",
    "property",
    "chance",
    "property",
    "tax",
    "property",
    "property",
    "chance",
    "property",
    "park",
    "property",
    "property",
    "chance",
  ];

  const shuffledNames = shuffle(PROPERTY_NAMES);
  let nameIndex = 0;

  for (let i = 0; i < tileCount; i++) {
    const type = pattern[i];
    let property: MiniMonopolyProperty | null = null;
    if (type === "property") {
      const areaIndex = Math.floor(nameIndex / 4) % AREAS.length;
      property = createProperty(areaIndex, shuffledNames[nameIndex]);
      nameIndex++;
    }
    tiles.push({ id: i, type, property });
  }

  return tiles;
}

export function createPlayers(
  setups: { name: string; isAi: boolean }[]
): MiniMonopolyPlayer[] {
  return setups.map((s, i) => ({
    id: `p${i}`,
    name: s.name || `Player ${i + 1}`,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
    money: 2000,
    position: 0,
    bankrupt: false,
    inJail: false,
    jailTurns: 0,
    isAi: s.isAi,
  }));
}

let logId = 0;

function log(
  state: MiniMonopolyState,
  key: string,
  params: Record<string, string | number | undefined> = {}
) {
  state.logs.unshift({ id: ++logId, key, params });
  if (state.logs.length > 50) state.logs.pop();
}

function currentPlayer(state: MiniMonopolyState): MiniMonopolyPlayer {
  return state.players[state.currentPlayerIndex];
}

function moveToNextPlayer(state: MiniMonopolyState) {
  let attempts = 0;
  do {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    if (state.currentPlayerIndex === 0) state.round++;
    attempts++;
  } while (currentPlayer(state).bankrupt && attempts < state.players.length);
}

function passStartBonus(state: MiniMonopolyState, player: MiniMonopolyPlayer) {
  player.money += 200;
  log(state, "minimonopoly.logPassStart", { name: player.name });
}

function applyChanceCard(state: MiniMonopolyState, player: MiniMonopolyPlayer) {
  const cards = [
    { key: "minimonopoly.chanceWin", params: { amount: 100 } },
    { key: "minimonopoly.chanceWin", params: { amount: 200 } },
    { key: "minimonopoly.chanceLose", params: { amount: 100 } },
    { key: "minimonopoly.chanceLose", params: { amount: 150 } },
    { key: "minimonopoly.chanceMove", params: { steps: 3 } },
    { key: "minimonopoly.chanceBack", params: { steps: 2 } },
    { key: "minimonopoly.chanceJail", params: {} },
    { key: "minimonopoly.chanceBonus", params: { amount: 50 } },
  ];
  const card = cards[Math.floor(Math.random() * cards.length)];

  switch (card.key) {
    case "minimonopoly.chanceWin":
      player.money += Number(card.params.amount);
      break;
    case "minimonopoly.chanceLose":
      player.money -= Number(card.params.amount);
      break;
    case "minimonopoly.chanceMove":
      movePlayerBy(state, player, Number(card.params.steps));
      break;
    case "minimonopoly.chanceBack":
      movePlayerBy(state, player, -Number(card.params.steps));
      break;
    case "minimonopoly.chanceJail":
      sendToJail(state, player);
      break;
    case "minimonopoly.chanceBonus":
      player.money += Number(card.params.amount);
      break;
  }

  state.lastCard = { key: card.key, params: card.params };
  log(state, card.key, { ...card.params, name: player.name });
}

function sendToJail(state: MiniMonopolyState, player: MiniMonopolyPlayer) {
  player.position = state.tiles.findIndex((t) => t.type === "jail") ?? 6;
  player.inJail = true;
  player.jailTurns = 0;
}

function movePlayerBy(
  state: MiniMonopolyState,
  player: MiniMonopolyPlayer,
  steps: number
) {
  const old = player.position;
  const len = state.tiles.length;
  player.position = (player.position + steps + len) % len;
  if (steps > 0 && player.position < old) {
    passStartBonus(state, player);
  }
}

export function rollDice(state: MiniMonopolyState): MiniMonopolyState {
  if (state.status !== "playing") return state;
  const player = currentPlayer(state);
  if (player.bankrupt || player.inJail) return state;

  state.dice = rollDie();
  const oldPos = player.position;
  const len = state.tiles.length;
  player.position = (player.position + state.dice) % len;
  if (player.position < oldPos) {
    passStartBonus(state, player);
  }

  state.pendingBuy = null;
  state.pendingUpgrade = null;
  state.lastCard = null;

  const tile = state.tiles[player.position];
  handleLand(state, player, tile);

  return state;
}

function handleLand(
  state: MiniMonopolyState,
  player: MiniMonopolyPlayer,
  tile: MiniMonopolyTile
) {
  switch (tile.type) {
    case "start":
      log(state, "minimonopoly.logLandStart", { name: player.name });
      break;
    case "park":
      log(state, "minimonopoly.logLandPark", { name: player.name });
      break;
    case "tax":
      player.money -= 150;
      log(state, "minimonopoly.logTax", { name: player.name, amount: 150 });
      checkBankruptcy(state, player);
      break;
    case "jail":
      sendToJail(state, player);
      log(state, "minimonopoly.logJail", { name: player.name });
      break;
    case "chance":
      applyChanceCard(state, player);
      checkBankruptcy(state, player);
      break;
    case "property":
      if (tile.property) {
        if (tile.property.ownerId === null) {
          state.pendingBuy = tile;
        } else if (tile.property.ownerId !== player.id) {
          const owner = state.players.find((p) => p.id === tile.property!.ownerId);
          const rent = tile.property.baseRent * tile.property.level;
          player.money -= rent;
          if (owner) owner.money += rent;
          log(state, "minimonopoly.logRent", {
            name: player.name,
            amount: rent,
            owner: owner?.name ?? "",
          });
          checkBankruptcy(state, player);
        } else {
          state.pendingUpgrade = tile;
        }
      }
      break;
  }
}

function checkBankruptcy(state: MiniMonopolyState, player: MiniMonopolyPlayer) {
  if (player.money < 0) {
    player.money = 0;
    player.bankrupt = true;
    for (const tile of state.tiles) {
      if (tile.property?.ownerId === player.id) {
        tile.property.ownerId = null;
      }
    }
    log(state, "minimonopoly.logBankrupt", { name: player.name });
    checkWin(state);
  }
}

export function buyProperty(state: MiniMonopolyState): MiniMonopolyState {
  if (!state.pendingBuy?.property) return state;
  const player = currentPlayer(state);
  const prop = state.pendingBuy.property;
  if (player.money >= prop.price) {
    player.money -= prop.price;
    prop.ownerId = player.id;
    log(state, "minimonopoly.logBuy", { name: player.name, property: prop.name });
  }
  state.pendingBuy = null;
  return state;
}

export function upgradeProperty(state: MiniMonopolyState): MiniMonopolyState {
  if (!state.pendingUpgrade?.property) return state;
  const player = currentPlayer(state);
  const prop = state.pendingUpgrade.property;
  if (prop.ownerId === player.id && prop.level < 3 && player.money >= prop.upgradeCost) {
    player.money -= prop.upgradeCost;
    prop.level++;
    log(state, "minimonopoly.logUpgrade", {
      name: player.name,
      property: prop.name,
      level: prop.level,
    });
  }
  state.pendingUpgrade = null;
  return state;
}

export function skipPropertyAction(state: MiniMonopolyState): MiniMonopolyState {
  state.pendingBuy = null;
  state.pendingUpgrade = null;
  return state;
}

export function endTurn(state: MiniMonopolyState): MiniMonopolyState {
  if (state.status !== "playing") return state;
  const player = currentPlayer(state);

  if (player.inJail) {
    player.jailTurns++;
    if (player.jailTurns >= 2 || player.money >= 100) {
      if (player.money >= 100) player.money -= 100;
      player.inJail = false;
      player.jailTurns = 0;
      log(state, "minimonopoly.logBail", { name: player.name });
    } else {
      log(state, "minimonopoly.logJailTurn", { name: player.name });
    }
  }

  state.pendingBuy = null;
  state.pendingUpgrade = null;
  state.lastCard = null;

  moveToNextPlayer(state);
  checkWin(state);
  return state;
}

function activePlayers(state: MiniMonopolyState): MiniMonopolyPlayer[] {
  return state.players.filter((p) => !p.bankrupt);
}

function checkWin(state: MiniMonopolyState) {
  const active = activePlayers(state);
  if (active.length === 1) {
    state.status = "finished";
    log(state, "minimonopoly.logWinner", { name: active[0].name });
    return;
  }
  if (state.round > state.maxRounds) {
    state.status = "finished";
    const winner = active.reduce((a, b) => (a.money > b.money ? a : b));
    log(state, "minimonopoly.logWinner", { name: winner.name });
  }
}

export function createMiniMonopolyState(
  setups: { name: string; isAi: boolean }[],
  maxRounds = 30
): MiniMonopolyState {
  logId = 0;
  return {
    tiles: generateBoard(),
    players: createPlayers(setups),
    currentPlayerIndex: 0,
    round: 1,
    maxRounds,
    status: "setup",
    dice: 0,
    lastCard: null,
    logs: [],
    pendingBuy: null,
    pendingUpgrade: null,
  };
}

export function startGame(state: MiniMonopolyState): MiniMonopolyState {
  state.status = "playing";
  log(state, "minimonopoly.logStart");
  return state;
}

export function restartGame(
  state: MiniMonopolyState
): MiniMonopolyState {
  const setups = state.players.map((p) => ({ name: p.name, isAi: p.isAi }));
  return createMiniMonopolyState(setups, state.maxRounds);
}

export function aiTurn(state: MiniMonopolyState): MiniMonopolyState {
  if (state.status !== "playing") return state;
  const player = currentPlayer(state);
  if (!player.isAi || player.bankrupt || player.inJail) return state;

  rollDice(state);
  if (state.pendingBuy?.property && player.money >= state.pendingBuy.property.price) {
    buyProperty(state);
  } else {
    skipPropertyAction(state);
  }
  if (state.pendingUpgrade?.property && player.money >= state.pendingUpgrade.property.upgradeCost) {
    upgradeProperty(state);
  }
  endTurn(state);
  return state;
}
