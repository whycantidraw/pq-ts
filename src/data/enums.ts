enum StatType {
    strength = "STR",
    condition = "CON",
    dexterity = "DEX",
    intelligence = "INT",
    wisdom = "WIS",
    charisma = "CHA",
    hp_max = "HP Max",
    mp_max = "MP Max"
}

enum TaskType {
    regular = "Regular",
    kill = "Kill",
    buy = "Buy",
    travelKillingFields = "Travel to Killing Fields",
    travelMarket = "Travel to Market",
    sell = "Sell",
    plot = "Plot"
}

enum EquipmentType {
    weapon = "Weapon",
    shield = "Shield",
    helm = "Helm",
    hauberk = "Hauberk",
    brassairts = "Brassairts",
    vambraces = "Vambraces",
    gauntlets = "Gauntlets",
    gambeson = "Gambeson",
    cuisses = "Cuisses",
    greaves = "Greaves",
    sollerets = "Sollerets"
}

const primeStats = [
    StatType.strength,
    StatType.condition,
    StatType.dexterity,
    StatType.intelligence,
    StatType.wisdom,
    StatType.charisma
]

const allStats = [
    ...primeStats,
    StatType.hp_max,
    StatType.mp_max
]

export { StatType, EquipmentType, primeStats, allStats, TaskType }