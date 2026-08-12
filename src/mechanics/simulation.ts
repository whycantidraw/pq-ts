import { below, belowLow, choice } from "../common/common";
import { actName, definite, indefinite } from "../common/lingo";
import { logger } from "../common/logger";
import { TaskType } from "../data/enums";
import {
    boringItem,
    impressiveGuy,
    interestingItem,
    monsterTask,
    namedMonster,
    unnamedMonster,
} from "./generation";
import { Player } from "./player";
import { Task } from "./quests";

export class Simulation {
    player: Player;
    lastTick: Date;

    constructor(player: Player) {
        this.player = player;
        this.lastTick = new Date();
    }

    tick(elapsed: number = 100.0) {
        this.player.elapsed += elapsed;

        if (this.player.task === null) {
            this.player.setTask(new Task("Loading", 2000, TaskType.regular));
            this.player.taskQueue.push(
                new Task("Experiencing an enigmatic and foreboding night vision", 10000),
                new Task("Much is revealed about that wise old bastard you'd underestimated", 6000),
                new Task("A shocking series of events leaves you alone and bewildered, but resolute", 6000),
                new Task("Drawing upon an unrealized reserve of determination, you set out on a long and dangerous journey", 4000),
                new Task(`Loading ${actName(1)}`, 2000, TaskType.plot),
            );
            this.player.questBook.plotBar.reset(28);
            return;
        }

        if (!this.player.taskBar.complete) {
            this.player.taskBar.increment(elapsed);
            return;
        }

        // gain XP / level up
        const gain = this.player.task.taskType === TaskType.kill;
        if (gain) {
            if (this.player.expBar.complete) {
                this.player.levelUp();
            } else {
                this.player.expBar.increment(this.player.taskBar.max / 1000);
            }
        }

        // advance quest
        if (gain && this.player.questBook.act >= 1) {
            if (this.player.questBook.questBar.complete || this.player.questBook.currentQuest === null) {
                this.completeQuest();
            } else {
                this.player.questBook.questBar.increment(this.player.taskBar.max / 1000);
            }
        }

        // advance plot
        if (gain) {
            if (this.player.questBook.plotBar.complete) {
                this.interplotCinematic();
            } else {
                this.player.questBook.plotBar.increment(this.player.taskBar.max / 1000);
            }
        }

        this.dequeue();
    }

    dequeue() {
        while (this.player.taskBar.complete) {
            const task = this.player.task;

            if (task && task.taskType === TaskType.kill) {
                if (!task.monster || !task.monster.item) {
                    // npc
                    this.player.winItem();
                } else {
                    this.player.inventory.addItem(
                        (task.monster.name + " " + task.monster.item).toLowerCase(),
                        1,
                    );
                }
            } else if (task && task.taskType === TaskType.buy) {
                // buy some equipment
                this.player.inventory.addGold(-this.player.equipPrice());
                this.player.winEquipment();
            } else if (task && (task.taskType === TaskType.travelMarket || task.taskType === TaskType.sell)) {
                if (task.taskType === TaskType.sell) {
                    const item = this.player.inventory.items[0]!;
                    let amount = item.quantity * this.player.level;
                    if (item.name.includes(" of ")) {
                        amount *= (1 + belowLow(10)) * (1 + belowLow(this.player.level));
                    }
                    this.player.inventory.removeItem(0);
                    this.player.inventory.addGold(amount);
                }
                if (this.player.inventory.items.length) {
                    const item = this.player.inventory.items[0]!;
                    this.player.setTask(
                        new Task("Selling " + indefinite(item.name, item.quantity), 1000, TaskType.sell),
                    );
                    break;
                }
            } else if (task && task.taskType === TaskType.plot) {
                this.completeAct();
            }

            const old = this.player.task;
            if (this.player.taskQueue.length) {
                this.player.setTask(this.player.taskQueue.shift()!);
            } else if (this.player.inventory.encumbranceBar.complete) {
                this.player.setTask(new Task("Heading to market to sell loot", 4000, TaskType.travelMarket));
            } else if (!(old && (old.taskType === TaskType.kill || old.taskType === TaskType.travelKillingFields))) {
                if (this.player.inventory.gold > this.player.equipPrice()) {
                    this.player.setTask(new Task("Negotiating purchase of better equipment", 5000, TaskType.buy));
                } else {
                    this.player.setTask(new Task("Heading to the killing fields", 4000, TaskType.travelKillingFields));
                }
            } else {
                this.player.setTask(monsterTask(this.player.level, this.player.questBook.monster));
            }
        }
    }

    completeAct() {
        this.player.questBook.incrementAct();
        this.player.questBook.plotBar.reset(60 * 60 * (1 + 5 * this.player.questBook.act));
        if (this.player.questBook.act > 1) {
            this.player.winItem();
            this.player.winEquipment();
        }
    }

    completeQuest() {
        this.player.questBook.questBar.reset(50 + belowLow(1000));
        if (this.player.questBook.currentQuest) {
            logger.info(`Quest completed: ${this.player.questBook.currentQuest}`);
            // reward the player for completing the quest
            choice([
                () => this.player.winSpell(),
                () => this.player.winEquipment(),
                () => this.player.winStat(),
                () => this.player.winItem(),
            ])();
        }

        this.player.questBook.monster = null;
        let caption = "";
        const c = below(5);
        if (c === 0) {
            this.player.questBook.monster = unnamedMonster(this.player.level, 3);
            caption = "Exterminate " + definite(this.player.questBook.monster.name, 2);
        } else if (c === 1) {
            caption = "Seek " + definite(interestingItem(), 1);
        } else if (c === 2) {
            caption = "Deliver this " + boringItem();
        } else if (c === 3) {
            caption = "Fetch me " + indefinite(boringItem(), 1);
        } else if (c === 4) {
            const monster = unnamedMonster(this.player.level, 1);
            caption = "Placate " + definite(monster.name, 2);
        }

        this.player.questBook.addQuest(caption);
    }

    interplotCinematic() {
        const enqueue = (task: Task) => {
            this.player.taskQueue.push(task);
            this.dequeue();
        };

        const c = below(3);
        if (c === 0) {
            enqueue(new Task("Exhausted, you arrive at a friendly oasis in a hostile land", 1000));
            enqueue(new Task("You greet old friends and meet new allies", 2000));
            enqueue(new Task("You are privy to a council of powerful do-gooders", 2000));
            enqueue(new Task("There is much to be done. You are chosen!", 1000));
        } else if (c === 1) {
            enqueue(new Task("Your quarry is in sight, but a mighty enemy bars your path!", 1000));

            const nemesis = namedMonster(this.player.level + 3);

            enqueue(new Task(`A desperate struggle commences with ${nemesis}`, 4000));

            let s = below(3);
            for (let i = 1; ; i++) {
                if (i > below(1 + this.player.questBook.act + 1)) {
                    break;
                }
                s += 1 + below(2);
                if (s % 3 === 0) {
                    enqueue(new Task(`Locked in grim combat with ${nemesis}`, 2000));
                } else if (s % 3 === 1) {
                    enqueue(new Task(`${nemesis} seems to have the upper hand`, 2000));
                } else {
                    enqueue(new Task(`You seem to gain the advantage over ${nemesis}`, 2000));
                }
            }

            enqueue(new Task(`Victory! ${nemesis} is slain! Exhausted, you lose consciousness`, 3000));
            enqueue(new Task("You awake in a friendly place, but the road awaits", 2000));
        } else if (c === 2) {
            const nemesis = impressiveGuy();
            enqueue(new Task(`Oh sweet relief! You've reached the protection of the good ${nemesis}`, 2000));
            enqueue(new Task(`There is rejoicing, and an unnerving encounter with ${nemesis} in private`, 3000));
            enqueue(new Task(`You forget your ${boringItem()} and go back to get it`, 2000));
            enqueue(new Task("What's this!? You overhear something shocking!", 2000));
            enqueue(new Task(`Could ${nemesis} be a dirty double-dealer?`, 2000));
            enqueue(new Task("Who can possibly be trusted with this news!? ... Oh yes, of course", 3000));
        }

        enqueue(new Task(`Loading ${actName(this.player.questBook.act + 1)}`, 1000, TaskType.plot));
    }
}
