import express, { Request, Response } from "express";
import cors from "cors";
import axios from "axios";
import cheerio from "cheerio";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

const port: number = 3300;
const url: string = "https://blox-fruits.fandom.com/wiki/Blox_Fruits_%22Stock%22";

interface FruitObj {
    name: string;
    price: number;
}

const removeDuplicateItems = (arr: string[]): string[] => {
    const uniqueFruitsSet: Set<string> = new Set(arr);
    const uniqueFruitsArr: string[] = [...uniqueFruitsSet];
    return uniqueFruitsArr;
}

const getFruits = (typeStockElement: string, res: Response): Promise<string[]> => {
    return axios(url).then(result => {
        const data = result.data;
        const $ = cheerio.load(data);
        const toRemoveDuplicateFruits: string[] = [];

        $(typeStockElement, data).each((i, ele) => {
            const getFruitName: any = $(ele).find("big b a").attr("title");
            toRemoveDuplicateFruits.push(getFruitName);
        });

        const fruitNames: string[] = removeDuplicateItems(toRemoveDuplicateFruits);

        return fruitNames;
    }).catch (error => {
        console.log(error);
        res.status(500).json();
        return [];
    });
}

const getPriceFruits = (typeStockElement: string, res: Response): Promise<string[]> => {
    return axios(url).then(result => {
        const data = result.data;
        const $ = cheerio.load(data);
        const toRemoveDuplicatePrice: string[] = [];

        $(typeStockElement, data).each((i, ele) => {
            const getFruitName: any = $(ele).find("span").last().text();
            toRemoveDuplicatePrice.push(getFruitName);
        });

        const fruitPrices = removeDuplicateItems(toRemoveDuplicatePrice);
        return fruitPrices;
    }).catch (error => {
        console.log(error);
        res.status(500).json();
        return [];
    });
}

app.get("/v1/currentstock", async (req: Request, res: Response) => {
    const currentStockElement: string = "#mw-customcollapsible-current figure > figcaption > center";
    const fruitNames = await getFruits(currentStockElement, res);
    const fruitPrices = await getPriceFruits(currentStockElement, res);
    const fruitsJson: FruitObj[] = [];

    for (let i = 0; i < fruitNames.length; i++) {
        fruitsJson.push({
            name: fruitNames[i],
            price: parseFloat(fruitPrices[i].replace(/,/g, '')),
        })
    }

    res.status(200).json(fruitsJson);
});

app.get("/v1/laststock", async (req: Request, res: Response) => {
    const lastStockElement: string = "#mw-customcollapsible-last figure > figcaption > center";
    const fruitNames = await getFruits(lastStockElement, res);
    const fruitPrices = await getPriceFruits(lastStockElement, res);
    const fruitsJson: FruitObj[] = [];
    for (let i = 0; i < fruitNames.length; i++) {
        fruitsJson.push({
            name: fruitNames[i],
            price: parseFloat(fruitPrices[i].replace(/,/g, "")),
        })
    }
    res.status(200).json(fruitsJson);
});

app.listen(port, () => {
    console.log("Server đã khởi động ở port", port);
});
