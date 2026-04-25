import { TaskType } from "../data/enums";
import type { Monster } from "./monsters";
import { Bar } from "./bars";

export class QuestBook {
    quests: string[];
    act: number;
    plotBar: Bar;
    questBar: Bar;

    constructor() {
        this.quests = [];
        this.act = 0;
        this.plotBar = new Bar(1);
        this.questBar = new Bar(1);
    }

    get currentQuest(): string | null {
        return this.quests.at(-1) || null;
    }

    increment(){
        this.act += 1;
        return ["start_act", this.act];
    }

    set addQuest(quest: string) {
        //logger.info("Commencing quest: %s", name)
        this.quests.push(quest);
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
        if (taskType === TaskType.kill && monster) {
            this.monster = monster;
        } else if (taskType === TaskType.kill && !monster) {
            throw new Error("Kill tasks must have a monster");
        }
    }
}