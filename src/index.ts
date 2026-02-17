import { getPublicClient } from "./clients/publicClient";
import { preConditions, sendEth } from "./utils/preConditions";


const main = async () => {
    const publicClient = await getPublicClient();
    await preConditions(publicClient);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});