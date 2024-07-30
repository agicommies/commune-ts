function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  while (true) {
    const now = new Date().toISOString();
    console.log(`[${now}] ping`);
    await sleep(1000);
  }
}

main().catch(console.error);
