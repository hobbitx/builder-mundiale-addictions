import { inject } from "../../Content";
import IConfiguration from "./Configuration";

export default class ActionFixerConfiguration implements IConfiguration {
    public onLoadConfiguration = (): void => {
        document.getElementById("identify-erros").addEventListener("click", this.startSearchingForErros);
    }

    private startSearchingForErros = async () => {
        console.log("START");
        const flow = await inject.getVariable("flow");
        let variablesCreate: Set<string> = new Set<string>();
        let variablesError: Set<string> = new Set<string>();
        for (const stateKey of Object.keys(flow)) {
            const state = flow[stateKey];
            variablesCreate = this.getVariables(state)
            console.log(variablesCreate)
            for (const output of this.getStateOutputs(state)) {
                const variablesWithError = this.hasErrorVariable(flow, state, output, variablesCreate);
                if (variablesWithError.size) {
                    variablesError = variablesWithError;
                    break;
                }
            }
            if (variablesError.size) {
                break;
            }
        }

        if (variablesError.size) {
            const currentTailArr = Array.from(variablesError);
            const loopTailLog = [...currentTailArr, currentTailArr[0]]
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
    private getVariables = (state: any) => {
        let variables = new Set<string>();
        let entryActions = state.$enteringCustomActions;
        let outActions = state.$leavingCustomActions;
        const hasInput = this.getStateInput(state);
        if (hasInput) {
            try {
                if (state.$contentActions.find((a: any) => a.input.variable) != undefined) {
                    variables.add(state.$contentActions.find((a: any) => a.input.variable))
                }
            } catch (e) {

            }
        }
        entryActions.forEach((element: any) => {
            if (element.type == "ExecuteScript") {
                variables.add(element.settings.outputVariable);
            } else if (element.type == "ProcessHttp") {
                variables.add(element.settings.responseBodyVariable);
            } else if (element.type == "SetVariable") {
                variables.add(element.settings.variable);
            }
        });
        outActions.forEach((element: any) => {
            if (element.type == "ExecuteScript") {
                variables.add(element.settings.outputVariable);
            } else if (element.type == "ProcessHttp") {
                variables.add(element.settings.responseBodyVariable);
            } else if (element.type == "SetVariable") {
                variables.add(element.settings.variable);
            }
        });
        return variables;
    }
    private getStateInput = (state: any) => {
        return state.$contentActions.find((a: any) => a.input && a.input.variable);
    }
    private chekVariables = (state: any, findVariables: Set<string>) => {
        let variables = new Set<string>();
        let entryActions = state.$enteringCustomActions;
        let outActions = state.$leavingCustomActions;
        const hasInput = this.getStateInput(state);
        console.log(hasInput)
        if (hasInput) {
            try {
                if (state.$contentActions.find((a: any) => a.input.variable) != undefined) {
                    if (!findVariables.has(state.$contentActions.find((a: any) => a.input.variable))) {
                        variables.add(state.$contentActions.find((a: any) => a.input.variable))
                    }
                }
            }
            catch (e) {

            }
        }
        entryActions.forEach((element: any) => {
            if (element.type == "ExecuteScript") {
                if (!findVariables.has(element.settings.outputVariable)) {
                    variables.add(element.settings.outputVariable);
                }
            } else if (element.type == "ProcessHttp") {
                if (!findVariables.has(element.settings.responseBodyVariable)) {
                    variables.add(element.settings.responseBodyVariable);
                }
            } else if (element.type == "SetVariable") {
                if (!findVariables.has(element.settings.variable)) {
                    variables.add(element.settings.variable);
                }
            }
        });
        outActions.forEach((element: any) => {
            if (element.type == "ExecuteScript") {
                if (!findVariables.has(element.settings.outputVariable)) {
                    variables.add(element.settings.outputVariable);
                }
            } else if (element.type == "ProcessHttp") {
                if (!findVariables.has(element.settings.responseBodyVariable)) {
                    variables.add(element.settings.responseBodyVariable);
                }
            } else if (element.type == "SetVariable") {
                if (!findVariables.has(element.settings.variable)) {
                    variables.add(element.settings.variable);
                }
            }
        });
        return variables;
    }
    private hasErrorVariable = (flow: any, state: any, output: any, variablesCreate: Set<string>) => {
        let variablesWithError = new Set<string>(variablesCreate);

        const outputState = flow[output.stateId];

        variablesWithError = this.chekVariables(outputState, variablesCreate);
        const outputStateOutputs = this.getStateOutputs(outputState);
        if (!outputStateOutputs || outputStateOutputs.length === 0) {
            return variablesWithError;
        }
        if (outputStateOutputs.some((o: any) => o.stateId === state.id)) {
            return variablesWithError;
        }
        console.log("ERRO");
        console.log(variablesWithError);
        outputStateOutputs.some((o: any) => {
            variablesCreate.forEach(variablesCreate.add, this.getVariables(o))
            variablesWithError.forEach(variablesWithError.add, this.hasErrorVariable(flow, state, o, variablesCreate));
        })
        return variablesWithError;
    }

    private getStateOutputs = (state: any) => {
        let outputs = state.$conditionOutputs;
        if (state.$defaultOutput) {
            outputs = [...(outputs || []), state.$defaultOutput];
        }
        return outputs;
    }
}
