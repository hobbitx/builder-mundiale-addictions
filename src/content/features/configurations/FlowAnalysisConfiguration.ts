import { inject } from "../../Content";
import IConfiguration from "./Configuration";

export default class FlowAnalysisConfiguration implements IConfiguration {
    public onLoadConfiguration = (): void => {
        document.getElementById("identify-erros").addEventListener("click", this.startAnalisys);
    }

    private startAnalisys = async () => {
        console.log("START");
        const flow = await inject.getVariable("flow");
        let statesError: Set<String> = new Set<String>();
        for (const stateKey of Object.keys(flow)) {
            const state = flow[stateKey];
            if (this.checkOutput(state)) {
                statesError.add(state.$title + ": Output conditions using contact extras")
            }
            if(this.outputConditions(state)){
                statesError.add(state.$title + ": Input not exists after intent in output conditions")
            }
            let actions = this.checkActions(state);
            actions.forEach(element => {
                statesError.add(state.$title + ": Using contact.extras in " + element)
            });
        }
        console.log(statesError)

        if (statesError.size) {
            const currentTailArr = Array.from(statesError);
            const loopTailLog = [...currentTailArr]
                .map((c) => `<li>${c}</li>`).join("");

            document.getElementById("found-erros").classList.remove("dn");
            document.getElementById("found-erros-container").innerHTML = loopTailLog;

            await inject.callFunction("ngToast", "danger", ["Your flow has erros. See the list."]);
        } else {
            document.getElementById("found-erros").classList.add("dn");

            await inject.callFunction("ngToast", "success", ["Your flow doesn't has erros. Nice!"]);
        }

        for (let i = 0; i < 2; i++) {
            (document.querySelector(".zoom.zoom-display") as HTMLElement).click();
        }
    }
    private outputConditions = (state: any) => {
        let hasError = false;
        let intentPos = 0;
        let notInputPos = 0;
        try {
            let outputs = state.$conditionOutputs;
            outputs.forEach((element: any,index: number) => {
                console.log(index)
                element.conditions.forEach((condition: any) => {
                    if (condition.source.includes("intent") && condition.comparison.includes("exists")) {
                        intentPos = index
                    }
                    if (condition.source.includes("input") && condition.comparison.includes("notExists")) {
                        notInputPos = index
                    }
                })
            });
            console.log(intentPos +","+notInputPos)
            hasError = intentPos < notInputPos;
        } catch (e) {
            hasError = false;
        }
        return hasError;
    }
    private checkActions = (state: any) => {
        let actions = new Set<string>();
        let entryActions = state.$enteringCustomActions;
        let outActions = state.$leavingCustomActions;
        entryActions.forEach((element: any) => {
            if (element.type == "ExecuteScript") {
                if (this.checkScript(element)) {
                    actions.add(element.$title);
                }
            } else if (element.type == "ProcessHttp") {
                if (this.checkHttp(element)) {
                    actions.add(element.$title);
                }
            }

        });
        outActions.forEach((element: any) => {
            if (element.type == "ExecuteScript") {
                if (this.checkScript(element)) {
                    actions.add(element.$title);
                }
            } else if (element.type == "ProcessHttp") {
                if (this.checkHttp(element)) {
                    actions.add(element.$title);
                }
            }

        });
        return actions;
    }

    private checkHttp = (action: any) => {
        let hasError = false;
        try {
            hasError = action.settings.body.includes("{{contact.extras.idBlip}}");
        } catch (e) {
            hasError = false;
        }
        return hasError;
    }
    private checkScript = (action: any) => {
        let hasError = false;
        try {
            action.settings.inputVariables.forEach((element: string) => {
                if (element.includes("contact.extras")) {
                    hasError = true;
                }
            });
        }
        catch (e) {
            hasError = false;
        }
        return hasError;
    }
    private checkOutput = (state: any) => {
        let hasError = false;
        try {
            let outputs = state.$conditionOutputs;
            outputs.forEach((element: any) => {
                element.conditions.forEach((condition: any) => {
                    if (condition.variable.includes("contact.extras")) {
                        hasError = true
                    }
                })
            });
        } catch (e) {
            hasError = false;
        }
        return hasError;
    }

}
