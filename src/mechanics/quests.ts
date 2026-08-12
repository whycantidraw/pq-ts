import { TaskType } from "../data/enums";
import type { Monster } from "./monsters";
import { Bar } from "./bars";

export class QuestBook {
    quests: string[];
    act: number;
    plotBar: Bar;
    questBar: Bar;
    monster: Monster | null;

    constructor() {
        this.quests = [];
        this.act = 0;
        this.plotBar = new Bar(1);
        this.questBar = new Bar(1);
        this.monster = null;
    }

    get currentQuest(): string | null {
        return this.quests.at(-1) || null;
    }

    incrementAct(){
        this.act += 1;
        return ["start_act", this.act];
    }

    addQuest(quest: string) {
        //logger.info("Commencing quest: %s", quest)
        this.quests = this.quests.slice(-100);
        this.quests.push(quest);
        return ["start_quest", quest];
    }
}

interface BaseTaskModel {
    description: string;
    duration: number;
}

export class Task implements BaseTaskModel {
    description: string;
    duration: number;
    taskType: TaskType;
    monster?: Monster;

    constructor(description: string, duration: number, taskType: TaskType = TaskType.regular, monster?: Monster) {
        this.description = description;
        this.duration = duration;
        this.taskType = taskType;
        // Kill tasks usually carry a monster, but NPC encounters have none.
        if (monster) {
            this.monster = monster;
        }
    }
}