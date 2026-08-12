import { Bar } from "./bars";

interface InventoryItem {
    name: string;
    quantity: number;
}

export class Inventory {
    gold: number;
    items: InventoryItem[];
    encumbranceBar: Bar;

    constructor(capacity: number = 0) {
        this.gold = 0
        this.items = [];
        this.encumbranceBar = new Bar(capacity);
    }

    addGold(quantity: number) {
        /*
        logger.info(
            "%s %s",
            "Spent" if quantity < 0 else "Got paid",
            indefinite("gold piece", abs(quantity)),
        )
        */
       this.gold += quantity;
       return ["gold_change", this.gold];
    }

    removeItem(index:number) {
        const item = this.items[index];
        //logger.info("Lost %s", indefinite(item.name, item.quantity))
        this.items.splice(index, 1);
        this.encumberanceCheck();
        return ["remove_item", item];
    }

    addItem(name: string, quantity: number) {
        //logger.info("Gained %s", indefinite(item_name, quantity))
        for (const item of this.items) {
            if (item.name === name) {
                item.quantity += quantity;
                this.encumberanceCheck();
                return ["change_item", item];
            }
        }
        const newItem = { name, quantity };
        this.items.push(newItem);
        this.encumberanceCheck();
        return ["add_item", newItem];
    }

    encumberanceCheck() {
        this.encumbranceBar.reposition(this.items.reduce((total, item) => total + item.quantity, 0));
    }

    set capacity(newCapacity: number) {
        this.encumbranceBar.reset(newCapacity, this.encumbranceBar.position);
    }
}