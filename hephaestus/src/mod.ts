/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/indent */
import { DependencyContainer } from "tsyringe";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { PreSptModLoader } from "@spt/loaders/PreSptModLoader";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { ImageRouter } from "@spt/routers/ImageRouter";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { ITraderAssort, ITraderBase } from "@spt/models/eft/common/tables/ITrader";
import { ITraderConfig, UpdateTime } from "@spt/models/spt/config/ITraderConfig";
import { JsonUtil } from "@spt/utils/JsonUtil";
import { Item } from "@spt/models/eft/common/tables/IItem";
import { ILocaleGlobalBase } from "@spt/models/spt/server/ILocaleBase";
import ImporterUtil from "@spt/utils/ImporterUtil"
import RagfairPriceService from "@spt/services/RagfairPriceService"
import { Traders } from "@spt/models/enums/Traders";
import { InventoryController } from "@spt/controllers/InventoryController";
import * as baseJson from "../db/base.json";
import type { StaticRouterModService } from "@spt/services/mod/staticRouter/StaticRouterModService";
import type { DynamicRouterModService } from "@spt/services/mod/dynamicRouter/DynamicRouterModService";
import { CustomItemService } from "@spt/services/mod/CustomItemService";
import { NewItemFromCloneDetails } from "@spt/models/spt/mod/NewItemDetails";
import config from "../config/config.json"
import { HashUtil } from "@spt/utils/HashUtil";
import fs from "fs";
import * as path from "path";

class Hephaestus implements IPreSptLoadMod, IPostDBLoadMod {
    modRoot: string
    mod: string
    static container;
    private logger: ILogger;

    constructor() {
        this.modRoot = path.join(__dirname, "../");
        this.mod = "yurikus.hephaestus";
    }

    // Perform these actions before server fully loads
    public preSptLoad(container: DependencyContainer): void {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        const PreSptModLoader: PreSptModLoader = container.resolve<PreSptModLoader>("PreSptModLoader");
        const imageRouter: ImageRouter = container.resolve<ImageRouter>("ImageRouter");
        const hashUtil: HashUtil = container.resolve<HashUtil>("HashUtil");
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const traderConfig: ITraderConfig = configServer.getConfig<ITraderConfig>(ConfigTypes.TRADER);

        const staticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");
        const dynamicRouterModService = container.resolve<DynamicRouterModService>("DynamicRouterModService");

        this.logger.debug(`[${this.mod}] Pre Loading... `);

        this.registerProfileImage(PreSptModLoader, imageRouter);

        const UpdateTime =
        {
            "_name": baseJson._id,
            "traderId": baseJson._id,
            "seconds":
            {
                "min": 1600,
                "max": 3600
            }
        }

        traderConfig.updateTime.push(UpdateTime);

        const traderRefreshRecord: UpdateTime = {
            traderId: baseJson._id,
            seconds: { min: 1600, max: 3600 }
        };

        traderConfig.updateTime.push(traderRefreshRecord);
        Traders[baseJson._id] = baseJson._id;

        staticRouterModService.registerStaticRouter(
            "HephaestusUpdateLogin",
            [{
                url: "/launcher/profile/login",
                action: async (url: string, info: any, sessionId: string, output: string) => {
                    try {
                        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
                        const tables = databaseServer.getTables();
                        tables.traders[baseJson._id].assort = { ...(await this.createAssortTable(container, sessionId, true)) };
                    } catch (error) {
                        // this.logger.error(error.message);
                    }
                    return output
                }
            }], "spt"
        );

        staticRouterModService.registerStaticRouter(
            "HephaestusUpdateWeaponSave",
            [{
                url: "/client/builds/weapon/save",
                action: async (url: string, info: any, sessionId: string, output: string) => {
                    try {
                        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
                        const tables = databaseServer.getTables();
                        tables.traders[baseJson._id].assort = { ...(await this.createAssortTable(container, sessionId)) };
                    } catch (error) {
                        // this.logger.error(error.message);
                    }
                    return output
                }
            }], "spt"
        );

        staticRouterModService.registerStaticRouter(
            "HephaestusUpdateBuildDelete",
            [{
                url: "/client/builds/delete",
                action: async (url: string, info: any, sessionId: string, output: string) => {
                    try {
                        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
                        const tables = databaseServer.getTables();
                        tables.traders[baseJson._id].assort = { ...(await this.createAssortTable(container, sessionId)) };
                    } catch (error) {
                        // this.logger.error(error.message);
                    }
                    return output
                }
            }], "spt"
        );

        dynamicRouterModService.registerDynamicRouter(
            "HephaestusUpdateExplicit",
            [{
                url: "/client/trading/api/getTraderAssort/6746722bcce65386cfcc7209",
                action: async (url: string, info: any, sessionId: string, output: string) => {
                    try {
                        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
                        const tables = databaseServer.getTables();
                        tables.traders[baseJson._id].assort = { ...(await this.createAssortTable(container, sessionId)) };
                    } catch (error) {
                        // this.logger.error(error.message);
                    }
                    return output
                }
            }], "spt"
        );

        // dynamicRouterModService.registerDynamicRouter(
        //     "HephaestusUpdate",
        //     [{
        //         url: "/client/trading/api/getTraderAssort/6746722bcce65386cfcc7209",
        //         action: (url: string, info: any, sessionId: string, output: string) => {
        //             this.logger.info(JSON.stringify(info));

        //             try {
        //                 const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        //                 const tables = databaseServer.getTables();
        //                 tables.traders[baseJson._id].assort = this.createAssortTable(container, sessionId);
        //             } catch (error) {
        //                 this.logger.error(error.message);
        //             }
        //             return output
        //         }
        //     }], "spt"
        // );

        this.logger.debug(`[${this.mod}] Pre Loaded`);
    }

    public postDBLoad(container: DependencyContainer): void {
        const logger = container.resolve<ILogger>("WinstonLogger");

        logger.debug(`[${this.mod}] Post Loading... `);

        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const configServer: ConfigServer = container.resolve<ConfigServer>("ConfigServer")
        const imageRouter: ImageRouter = container.resolve<ImageRouter>("ImageRouter")
        const traderConfig: ITraderConfig = configServer.getConfig(ConfigTypes.TRADER)
        const jsonUtil = container.resolve<JsonUtil>("JsonUtil");
        const tables = databaseServer.getTables();
        const locales = Object.values(tables.locales.global) as Record<string, string>[];

        let base = jsonUtil.deserialize(jsonUtil.serialize(baseJson)) as ITraderBase;

        base.repair = {
            "availability": true,
            "currency": config.currency || "569668774bdc2da2298b4568",
            "currency_coefficient": 1,
            "excluded_category": [],
            "excluded_id_list": [],
            "price_rate": 0,
            "quality": "0"
        }

        base.loyaltyLevels = [{
            "minLevel": 1,
            "minSalesSum": 0,
            "minStanding": 0,
            "buy_price_coef": 50,
            "repair_price_coef": 300,
            "insurance_price_coef": 10,
            "exchange_price_coef": 0,
            "heal_price_coef": 0
        }];

        tables.traders[baseJson._id] = {
            assort: {
                items: [],
                barter_scheme: {},
                loyal_level_items: {}
            },
            base,
            questassort: { started: {}, success: {}, fail: {} }
        };

        // const importer = container.resolve<ImporterUtil>("ImporterUtil");
        // let profiles = importer.loadRecursive('user/profiles/');

        for (const locale of locales) {
            locale[`${baseJson._id} FullName`] = baseJson.name;
            locale[`${baseJson._id} FirstName`] = "Hephaestus";
            locale[`${baseJson._id} Nickname`] = baseJson.nickname;
            locale[`${baseJson._id} Location`] = baseJson.location;
            locale[`${baseJson._id} Description`] = "You share the reseller license of your creations to Hephaestus and in return you get a hefty discount.";
        }

        // add tiny box
        const tinyBox: NewItemDetails = {
            fleaPriceRoubles: 1920500,
            handbookPriceRoubles: 1320500,
            handbookParentId: "5b5f6fa186f77409407a7eb7",
            locales: {
                "en": {
                    name: "Tiny stuff box",
                    shortName: "Stuff",
                    description: `A large (but tiny) storage case for all sorts of different items and goods that you may or may not need`
                }
            },
            newItem: {
                "_id": "5b7c710788a4506dec015958",
                "_name": "item_container_junkbox_tiny",
                "_parent": "5795f317245977243854e041",
                "_type": "Item",
                "_proto": "577e1c9d2459773cd707c525",
                "_props": {
                    "AnimationVariantsNumber": 0,
                    "BackgroundColor": "yellow",
                    "CanRequireOnRagfair": false,
                    "CanSellOnRagfair": true,
                    "ConflictingItems": [],
                    "Description": "junkbox_tiny",
                    "DiscardLimit": 0,
                    "DiscardingBlock": false,
                    "DropSoundType": "None",
                    "ExamineExperience": 10,
                    "ExamineTime": 0.2,
                    "ExaminedByDefault": true,
                    "ExtraSizeDown": 0,
                    "ExtraSizeForceAdd": false,
                    "ExtraSizeLeft": 0,
                    "ExtraSizeRight": 0,
                    "ExtraSizeUp": 0,
                    "Height": 2,
                    "HideEntrails": true,
                    "InsuranceDisabled": false,
                    "IsAlwaysAvailableForInsurance": false,
                    "IsLockedafterEquip": false,
                    "IsSecretExitRequirement": false,
                    "IsSpecialSlotOnly": false,
                    "IsUnbuyable": false,
                    "IsUndiscardable": false,
                    "IsUngivable": false,
                    "IsUnremovable": false,
                    "IsUnsaleable": false,
                    "ItemSound": "container_plastic",
                    "LootExperience": 30,
                    "MergesWithChildren": false,
                    "Name": "junkbox_tiny",
                    "NotShownInSlot": false,
                    "Prefab": {
                        "path": "assets/content/items/containers/item_container_junkbox/item_container_junkbox.bundle",
                        "rcid": ""
                    },
                    "QuestItem": false,
                    "QuestStashMaxCount": 0,
                    "RagFairCommissionModifier": 1,
                    "RarityPvE": "Not_exist",
                    "RepairCost": 0,
                    "RepairSpeed": 0,
                    "ShortName": "junkbox_tiny",
                    "StackMaxSize": 1,
                    "StackObjectsCount": 1,
                    "Unlootable": false,
                    "UnlootableFromSide": [],
                    "UnlootableFromSlot": "FirstPrimaryWeapon",
                    "UsePrefab": {
                        "path": "",
                        "rcid": ""
                    },
                    "Weight": 0.001,
                    "Width": 2,
                    "CanPutIntoDuringTheRaid": true,
                    "CantRemoveFromSlotsDuringRaid": [],
                    "ForbidMissingVitalParts": false,
                    "ForbidNonEmptyContainers": false,
                    "Grids": [
                        {
                            "_name": "main",
                            "_id": "5b7c710788a4506dec01595a",
                            "_parent": "5b7c710788a4506dec015958",
                            "_props": {
                                "filters": [],
                                "cellsH": 19,
                                "cellsV": 16,
                                "minCount": 0,
                                "maxCount": 0,
                                "maxWeight": 0,
                                "isSortingTable": false
                            },
                            "_proto": "55d329c24bdc2d892f8b4567"
                        }
                    ],
                    "Slots": [],
                    "TagColor": 0,
                    "TagName": "",
                    "__baseWeight": 0.005
                }
            }
        };

        const itemService = container.resolve<CustomItemService>("CustomItemService");
        const ret = itemService.createItem(tinyBox);
        this.logger.info(`TinyBox: created=${ret.success}, id=${ret.itemId}`);

        logger.debug(`[${this.mod}] Post Loaded`);
    }

    /*
        private resetQuests(container: DependencyContainer, sessionId: string) {
            let profile = container.resolve("ProfileHelper").getFullProfile(sessionId);
            const saveServer = container.resolve("SaveServer");
            let pmc = profile.characters.pmc;
    
            if (!pmc || !pmc.Quests) {
                // avoid crash on first game start (fresh profile)
                pmc.Quests = [];
            }
            
            pmc.Quests.filter(
                (q) => (q.status > 0)
            ).forEach((repeatedQuest) => {
                const originalId = questIds.find(qid => qid == repeatedQuest.qid);
                if (originalId) {
                    pmc.Quests = pmc.Quests.map((q) => {
                        if (q.qid === originalId) {
                            return { ...repeatedQuest, qid: originalId };
                        }
                        return q;
                    });
                }
            });
            
            pmc.BackendCounters = Object.keys(pmc.BackendCounters).reduce((acc, key) => {
                if (!questIds.some(qid => qid == pmc.BackendCounters[key].qid)) {
                    acc[key] = pmc.BackendCounters[key];
                }
                return acc;
            }, {})
            
            if (pmc.ConditionCounters) {
                pmc.ConditionCounters.Counters =
                    pmc.ConditionCounters?.Counters.filter((counter) => {
                        if (questIds.some(qid => qid == counter.qid)) {
                            return false;
                        }
                        return true;
                    }) ?? [];
            }
            
            pmc.Quests = pmc.Quests.filter(q => !questIds.some(qid => qid == q.qid))
    
            // const questHelper = container.resolve("QuestHelper");
            // let pmcData = container.resolve("ProfileHelper").getPmcProfile(sessionId);
            // questIds.forEach((qid) => {
            //     questHelper.resetQuestState(pmcData, 1, qid)
    
            // })
            saveServer.saveProfile(sessionId)
        }
    */

    private registerProfileImage(PreSptModLoader: PreSptModLoader, imageRouter: ImageRouter): void {
        // Register a route to point to the profile picture
        imageRouter.addRoute(baseJson.avatar.replace(".jpg", ""), `${this.modRoot}/res/Hephaestus.jpg`);
    }

    private getPresets(container: DependencyContainer, assortTable, currency, profiles, loadExternal = false) {
        const jsonUtil = container.resolve<JsonUtil>("JsonUtil");
        const ragfairPriceService = container.resolve<RagfairPriceService>("RagfairPriceService");

        let pool = [];
        interface IWeaponBuild {
            name: string,
            items: Item[],
            root: string
        }

        let weaponBuilds: any = [];
        for (const p in profiles) {
            if (!profiles[p]?.userbuilds) continue;
            weaponBuilds = weaponBuilds.concat(profiles[p].userbuilds.weaponBuilds);
        }

        let external = 0;
        if (loadExternal) {
            this.logger.info(`${this.mod}: Loading/Refreshing external sources ...`);

            const PreSptModLoader: PreSptModLoader = container.resolve<PreSptModLoader>("PreSptModLoader");

            try {
                let builds = fs.readdirSync(`${this.modRoot}/presets/`);

                let success = 0;
                builds.forEach((build) => {
                    try {
                        let temp = fs.readFileSync(`${this.modRoot}/presets/${build}`);
                        weaponBuilds = weaponBuilds.concat(JSON.parse(temp));
                        success++;
                    } catch (error) {
                        this.logger.error(`loading ${build} failed, check syntax and file structure.`)
                    }
                });

                this.logger.info(`${this.mod}: Loaded/Refreshed ${success} external builds from external sources.`);

            } catch (error) {
                // this.logger.error(error.message);
            }
        }

        this.logger.info(`${this.mod}: Loaded/Refreshed ${weaponBuilds.length} weapon builds in total.`);

        for (let wb of weaponBuilds) {
            let preItems = wb.Items;
            let id = preItems[0]._id;
            let tpl = preItems[0]._tpl;

            if (pool.includes(id)) {
                continue;
            }

            pool.push(id)

            preItems[0] = {
                "_id": id,
                "_tpl": tpl,
                "parentId": "hideout",
                "slotId": "hideout",
                "BackgroundColor": "yellow",
                "upd": {
                    "UnlimitedCount": true,
                    "StackObjectsCount": 999
                },
            };

            let preItemsObj = jsonUtil.clone(preItems);
            for (let preItemObj of preItemsObj) {
                assortTable.items.push(preItemObj);
            }

            let config;
            try {
                config = require(`${this.modRoot}/config/config.json`);
            } catch (e) {
                this.logger.error(e)
            }

            let price = (config || {}).cost || 712
            try {
                price = ragfairPriceService.getDynamicOfferPriceForOffer(preItems, currency);
            } catch (error) {
            }

            if (config?.discount) {
                config.discount = parseFloat(config.discount)
                price = price * (1 - ((config.discount || 100) / 100))
            }

            let offerRequire = [{
                "count": price,
                "_tpl": currency
            }];

            assortTable.barter_scheme[id] = [offerRequire];
            assortTable.loyal_level_items[id] = 1;
        }

        return assortTable;
    }

    private async createAssortTable(container, sessionId, loadExternal?: any): ITraderAssort {
        const importer = container.resolve("ImporterUtil");

        // Assort table
        let assortTable: ITraderAssort = {
            items: [],
            barter_scheme: {},
            loyal_level_items: {}
        }

        // const currency = "5449016a4bdc2d6f028b456f"; //ROUBLES
        let profiles = {};
        if (sessionId && !config.fika_enabled) {
            let t = container.resolve("ProfileHelper").getFullProfile(sessionId)
            profiles = { [sessionId]: t };
        } else {
            profiles = await importer.loadAsync('user/profiles/');
        }

        try {
            assortTable = this.getPresets(container, assortTable, config.currency || "569668774bdc2da2298b4568", profiles, true);
        } catch (error) {
        }

        return assortTable;
    }
}

module.exports = { mod: new Hephaestus() }
