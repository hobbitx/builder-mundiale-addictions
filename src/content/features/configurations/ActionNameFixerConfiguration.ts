import Utils from "../../../shared/Utils";
import { inject } from "../../Content";
import IConfiguration from "./Configuration";

export default class ActionNameFixerConfiguration implements IConfiguration {
    private readonly possibleActions = [
        {
            alias: ["Registro de eventos", "Event tracking"],
            name: "TrackEvent",
            nameResolver: (settings: any) => `Track ${settings.category}`,
        }, {
            alias: ["Executar script", "Execute script"],
            name: "ExecuteScript",
            nameResolver: (settings: any) => `Execute script - ${settings.outputVariable}`,
        }, {
            alias: ["Redirecionar a um serviço", "Redirect to service"],
            name: "Redirect",
            nameResolver: (settings: any) => `Redirect to service - ${settings.address}`,
        }, {
            alias: ["Requisição HTTP", "Process HTTP"],
            name: "ProcessHttp",
            nameResolver: (settings: any) => `Request HTTP - ${this.clearURI(settings.uri)}`,
        }, {
            alias: ["Definir variável", "Set variable"],
            name: "SetVariable",
            nameResolver: (settings: any) => `Set variable - ${settings.variable}`,
        }];

    public onLoadConfiguration = (): void => {
        document.getElementById("fix-action-names-apply-btn").addEventListener("click", this.handleFixActionNames);
    }
    private clearURI = (uri: string): string => {
        var newUri = uri;
        try {
            
            newUri = uri.replace(/({{)(\w*(.)*)(}})/gi, "");
            newUri = newUri.replace("/leads", "");
            newUri = newUri.replace(/[/]/g, " ");
            if(newUri.includes("google-analytics")){
                newUri = "GOOGLE ANALYSTICS";
            }
            if(newUri.includes("welcome-messages/exists")){
                newUri = "isPostbackJs";
            }
            if(newUri.includes("/process-message")){
                newUri = "build";
            }
            if(newUri.includes("/commands")){
                newUri = "save extras";
            } if(newUri.includes("loggly")){
                newUri = "loggly";
            }
        }
        catch (e) {
        }
        return newUri;
    }
    private handleFixActionNames = async () => {
        try {
            await inject.callFunction("LoadingService", "startLoading", [false]);

            const flow = await inject.getVariable("flow");
            Object.keys(flow).forEach((k: string) => {
                flow[k].$enteringCustomActions = flow[k].$enteringCustomActions.map(this.replaceActionNameIfDefault);
                flow[k].$leavingCustomActions = flow[k].$leavingCustomActions.map(this.replaceActionNameIfDefault);
            });

            await inject.callFunction("BuilderService", "setFlow", [flow]);

            await Utils.sleep(500);
            await inject.callFunction("LoadingService", "stopLoading", []);
            await inject.callFunction("$state", "reload", []);
        } catch (e) {
            // tslint:disable-next-line: no-console
            console.error(e);

            await inject.callFunction("LoadingService", "stopLoading", []);
            await inject.callFunction("ngToast", "danger",
                [`Error when trying to apply action names. "${e}"`]);
        }
    }

    private replaceActionNameIfDefault = (action: any) => {
        try {
            const actionNameResolver = this.possibleActions.find((p) => p.name === action.type);
            if(actionNameResolver != undefined){   
                action.$title = actionNameResolver.nameResolver(action.settings);
            }
           
        }
        catch (e) {

        }
        return action;
    }
}
