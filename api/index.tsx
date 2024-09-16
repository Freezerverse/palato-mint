import { Button, Frog } from 'frog'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/vercel'
import { abi } from '../abi.js'
import { pinata } from 'frog/hubs'
import { config } from 'dotenv';
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import type {Address} from 'viem'
// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// }

config();
const contractAddress:string = process.env.CONTRACT || "";
const sdk = new ThirdwebSDK("polygon",{clientId:process.env.CLIENTID});
async function getMintPrice(){
  const contract = await sdk.getContract(contractAddress);
  const mintPrice = await contract.call("mint_price")
  return mintPrice
}


export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  // Supply a Hub to enable frame verification.
  hub: pinata(),
  title: 'Frog Frame',
})

app.frame('/', (c) => {
  return c.res({
    image: `${process.env.ENDPOINT}/mint.png`,
    imageAspectRatio: "1:1",
    intents: [
     <Button.Transaction target='/mint'>Mint</Button.Transaction>
    ],
  })
})

app.frame('/finish', (c) => {
  const {transactionId} = c
  return c.res({
    action: "/",
    image:`${process.env.ENDPOINT}/thanks.png`,
    imageAspectRatio: "1:1",
    intents: [
     <Button>Mint again!</Button>,
     <Button.Redirect location='https://discord.com/invite/2VDEm4NPJH'>Join our Discord</Button.Redirect>,
     <Button.Redirect location={`https://polygonscan.com/tx/${transactionId}`}>View TX</Button.Redirect>,
     
    ],
  })
})

app.transaction('/mint', async (c) => {
  const price = await getMintPrice()
    return c.contract({
      chainId: 'eip155:137',
      functionName: 'publicMint',
      args: [1n],
      to: contractAddress as Address,
      abi: abi,
      value: price
    })
})

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== 'undefined'
const isProduction = isEdgeFunction || import.meta.env?.MODE !== 'development'
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
