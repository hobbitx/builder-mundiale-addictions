import Utils from "../../shared/Utils";
import { inject } from "../Content";
import FeatureBase from "./FeatureBase";

export default class AutoTag extends FeatureBase {
    public onLoadBuilder(): void {
        this.startAsync();
    }

    private async startAsync(): Promise<void> {
        await inject.interceptFunction("SidebarContentService", "showSidebar", this.addEventListeners);
    }

    private addEventListeners = () => {
        const elements: NodeListOf<Element> =
            document.querySelectorAll("li[ng-click^='$ctrl.onAddAction'], i[ng-click^='$ctrl.onDeleteAction']");

        elements.forEach((e: Element) => {
            e.removeEventListener("click", this.repairWrongTags);
            e.addEventListener("click", this.repairWrongTags);
        });

        const contents: NodeListOf<Element> =
            document.querySelectorAll("li[ng-click^='$ctrl.showTab(tab)']");

        contents.forEach((e: Element) => {
            e.removeEventListener("click", this.addInputs);
            e.addEventListener("click", this.addInputs);
        });

    }   
    private addInputs = async () => {
        const tagName = "ASK";
        const inputAwait: [] = await inject.getVariable('editingState');
        const hasInput = this.getStateInput(inputAwait);
        if(hasInput){
            this.AddAskTag(tagName);
        }
        else{
        const tagElements = Array.from(document.querySelectorAll(".sidebar-content-header .blip-tag__label"));
        const correctTagElement = tagElements.find((t) => t.textContent.trim() === this.getCorrectName(tagName));
            if (correctTagElement && correctTagElement.nextElementSibling) {
                (correctTagElement.nextElementSibling as HTMLElement).click();
            }
        }
    }

    private repairWrongTags = async () => {
        if (!this.isEnabled) {
            return;
        }

        const enteringCustomActions: [] = await inject.getVariable("editingState.$enteringCustomActions");
        const leavingCustomAction: [] = await inject.getVariable("editingState.$leavingCustomActions");
      
        let actions: any[] = [...enteringCustomActions, ...leavingCustomAction];
        actions = actions.map((a) => a.type);

        let tags: any[] = await inject.getVariable("editingState.$tags");
        tags = (tags || []).map((t) => t.label);

        const possibleActions = [
            ...new Set(Array.from(document.querySelectorAll("li[ng-click^='$ctrl.onAddAction']"))
                .map((a) => a.getAttribute("ng-click").match("'(.*)'")[1]))];

        const shouldFixTags = tags.filter((t) => !actions.includes(t) && possibleActions.includes(t));
        shouldFixTags.forEach(this.RemoveTag);

        const shouldFixActions = actions.filter((a) => !tags.includes(a));
        shouldFixActions.forEach(this.AddTag);
    }
    private getCorrectName= (tagName: string) =>{
        if(tagName == "ProcessHttp"){
            return "API";
        }
        if(tagName == "ExecuteScript"){
            return "SCRIPT";
        }
        if(tagName == "Redirect"){
            return "REDIRECT - SERVICE";
        }

        return 'false';
    }
    private getStateInput = (state: any) => {
        return state.$contentActions.find((a: any) => a.input && !a.input.bypass);
    }

    private RemoveTag = (tagName: string) => {
        const tagElements = Array.from(document.querySelectorAll(".sidebar-content-header .blip-tag__label"));
        const correctTagElement = tagElements.find((t) => t.textContent.trim() === this.getCorrectName(tagName));
        if (correctTagElement && correctTagElement.nextElementSibling) {
            (correctTagElement.nextElementSibling as HTMLElement).click();
        }
    }
    private AddAskTag = async (tagName: string) => {
        const hasTag = this.getCorrectName(tagName);
        const tagElements = Array.from(document.querySelectorAll(".sidebar-content-header .blip-tag__label"));
        const correctTagElement = tagElements.find((t) => t.textContent.trim() === this.getCorrectName(tagName));
        if (correctTagElement && correctTagElement.nextElementSibling) {
            return;
        }
        if(hasTag === 'false'){
            return;
        }
        const tab = document.getElementById("node-content-tab");

        const header = tab.getElementsByClassName("sidebar-content-header")[0];
        const tagMenuBtn = header.getElementsByTagName("img");

        if (tagMenuBtn.length > 0) {
            tagMenuBtn[0].click();
        }

        const tagMenu = header.getElementsByTagName("blip-tags")[0];
        
        const input = tagMenu.getElementsByTagName("input")[0];
        input.value = this.getCorrectName(tagName);
        await Utils.sleep(30);
        
        var event = new Event('input', {
            bubbles: true,
            cancelable: true,
        });
        input.dispatchEvent(event);

        await Utils.sleep(30);

        const options = tagMenu.getElementsByClassName("blip-select__options") as HTMLCollectionOf<HTMLElement>;
        if (options.length > 0) {
            options[0].style.display = "none";

            const correctTagOption =
                options[0].getElementsByClassName("blip-select__option") as HTMLCollectionOf<HTMLElement>;

            if (correctTagOption.length > 0) {
                correctTagOption[0].click();

                await Utils.sleep(20);

                const color = this.configuration[tagName.toLowerCase()];

                const colorSelector =
                    tagMenu.getElementsByClassName("blip-tag-select-color") as HTMLCollectionOf<HTMLElement>;

                if (colorSelector && colorSelector.length > 0) {
                    colorSelector[0].style.display = "none";

                    const colors = colorSelector[0]
                        .getElementsByClassName("blip-tag-color-option") as HTMLCollectionOf<HTMLElement>;

                    if (colors.length > 0) {
                        for (const colorElement of Array.from(colors)) {
                            const currentColor = colorElement.getAttribute("data-color");

                            if (currentColor === color) {
                                colorElement.click();
                            }
                        }
                    }

                }
            }
        }

    }
    private AddTag = async (tagName: string) => {

        const tab = document.getElementById("node-content-tab");

        const header = tab.getElementsByClassName("sidebar-content-header")[0];
        const tagMenuBtn = header.getElementsByTagName("img");

        if (tagMenuBtn.length > 0) {
            tagMenuBtn[0].click();
        }

        const tagMenu = header.getElementsByTagName("blip-tags")[0];
        
        const input = tagMenu.getElementsByTagName("input")[0];
        input.value = this.getCorrectName(tagName);

        await Utils.sleep(30);
        
        var event = new Event('input', {
            bubbles: true,
            cancelable: true,
        });
        input.dispatchEvent(event);

        await Utils.sleep(30);

        const options = tagMenu.getElementsByClassName("blip-select__options") as HTMLCollectionOf<HTMLElement>;

        if (options.length > 0) {
            options[0].style.display = "none";

            const correctTagOption =
                options[0].getElementsByClassName("blip-select__option") as HTMLCollectionOf<HTMLElement>;

            if (correctTagOption.length > 0) {
                correctTagOption[0].click();

                await Utils.sleep(20);

                const color = this.configuration[tagName.toLowerCase()];

                const colorSelector =
                    tagMenu.getElementsByClassName("blip-tag-select-color") as HTMLCollectionOf<HTMLElement>;

                if (colorSelector && colorSelector.length > 0) {
                    colorSelector[0].style.display = "none";

                    const colors = colorSelector[0]
                        .getElementsByClassName("blip-tag-color-option") as HTMLCollectionOf<HTMLElement>;

                    if (colors.length > 0) {
                        for (const colorElement of Array.from(colors)) {
                            const currentColor = colorElement.getAttribute("data-color");

                            if (currentColor === color) {
                                colorElement.click();
                            }
                        }
                    }

                }
            }
        }
    }
}
