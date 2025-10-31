import { Flex, Text, Box } from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import { CreateDAODexSettingsForm } from "../types";
import { useEffect, useState } from "react";
import { ContractId } from "@hashgraph/sdk";
import { DexService } from "@dex/services";
import { SINGLE_DAO_DEX_SETTINGS } from "@dao/config/singleDao";
import { ContractInterface, ethers } from "ethers";

function shortenAddress(address: string, startLength: number = 6, endLength: number = 4) {
  const addr = address.trim();
  if (addr.length <= startLength + endLength) return addr;
  const start = addr.slice(0, startLength);
  const end = addr.slice(-endLength);
  return `${start}...${end}`;
}

function useParamStoreValues() {
  const cfg = SINGLE_DAO_DEX_SETTINGS?.parameterStore;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<{ maxTradeBps?: number; maxSlippageBps?: number; tradeCooldownSec?: number }>();

  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!cfg?.contractId || !cfg?.abi) return;
      try {
        setLoading(true);
        setError(null);
        const address = ContractId.fromString(cfg.contractId).toSolidityAddress();
        const { JsonRpcSigner } = DexService.getJsonRpcProviderAndSigner();
        const contract = new ethers.Contract(address, cfg.abi, JsonRpcSigner);
        let maxTradeBps: number | undefined;
        let maxSlippageBps: number | undefined;
        let tradeCooldownSec: number | undefined;
        try {
          if (cfg.methods?.maxTradeBps) {
            const v = await contract[cfg.methods.maxTradeBps]();
            maxTradeBps = Number(v.toString());
          }
        } catch {
          /* empty */
        }
        try {
          if (cfg.methods?.maxSlippageBps) {
            const v = await contract[cfg.methods.maxSlippageBps]();
            maxSlippageBps = Number(v.toString());
          }
        } catch {
          /* empty */
        }
        try {
          if (cfg.methods?.tradeCooldownSec) {
            const v = await contract[cfg.methods.tradeCooldownSec]();
            tradeCooldownSec = Number(v.toString());
          }
        } catch {
          /* empty */
        }
        if (!maxTradeBps && !maxSlippageBps && !tradeCooldownSec) {
          try {
            const readAllMethod = cfg.methods?.readAll || "getRiskParameters";
            const tuple = await contract[readAllMethod]();
            if (Array.isArray(tuple) && tuple.length >= 3) {
              maxTradeBps = Number(tuple[0].toString());
              maxSlippageBps = Number(tuple[1].toString());
              tradeCooldownSec = Number(tuple[2].toString());
            }
          } catch {
            /* empty */
          }
        }
        if (!ignore) setValues({ maxTradeBps, maxSlippageBps, tradeCooldownSec });
      } catch (e: any) {
        if (!ignore) setError(e?.message ?? "Failed to read ParameterStore values");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [cfg?.contractId, JSON.stringify(cfg?.abi), JSON.stringify(cfg?.methods)]);

  return { loading, error, values };
}

function useCurrentPairs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairs, setPairs] = useState<{ tokenA: string; tokenB: string }[]>([]);

  useEffect(() => {
    let ignore = false;
    async function run() {
      try {
        setLoading(true);
        setError(null);
        const cfg = SINGLE_DAO_DEX_SETTINGS?.pairWhitelist;
        const res: { tokenA: string; tokenB: string }[] = [];
        try {
          const address = ContractId.fromString(cfg?.contractId as string).toSolidityAddress();
          const { JsonRpcSigner } = DexService.getJsonRpcProviderAndSigner();
          const contract = new ethers.Contract(address, cfg?.abi as ContractInterface, JsonRpcSigner);
          const method = cfg?.methods?.getPairs || "getAllWhitelistedPairs";
          const out = await contract[method]();
          if (Array.isArray(out)) {
            for (const item of out) {
              try {
                // eslint-disable-next-line max-len
                const tokenIn =
                  typeof item?.tokenIn === "string" ? item.tokenIn : Array.isArray(item) ? item[0] : undefined;
                // eslint-disable-next-line max-len
                const tokenOut =
                  typeof item?.tokenOut === "string" ? item.tokenOut : Array.isArray(item) ? item[1] : undefined;
                if (typeof tokenIn === "string" && typeof tokenOut === "string") {
                  res.push({ tokenA: tokenIn, tokenB: tokenOut });
                }
              } catch {
                /* ignore */
              }
            }
          }
        } catch (e) {
          /* ignore */
        }
        if (!ignore) setPairs(res);
      } catch (e: any) {
        if (!ignore) setError(e?.message ?? "Failed to fetch current pairs");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, []);

  return { loading, error, pairs };
}

export function DAODexSettingsReviewForm() {
  const { getValues } = useFormContext<CreateDAODexSettingsForm>();
  const formValues = getValues();
  const { values: currentParams, loading: paramsLoading, error: paramsError } = useParamStoreValues();
  const { pairs: currentPairs, loading: pairsLoading, error: pairsError } = useCurrentPairs();

  // eslint-disable-next-line max-len
  const displayMaxTrade =
    formValues.maxTradeBps === undefined ||
    (currentParams?.maxTradeBps !== undefined && formValues.maxTradeBps === currentParams.maxTradeBps)
      ? "(no changes)"
      : formValues.maxTradeBps;
  // eslint-disable-next-line max-len
  const displayMaxSlippage =
    formValues.maxSlippageBps === undefined ||
    (currentParams?.maxSlippageBps !== undefined && formValues.maxSlippageBps === currentParams.maxSlippageBps)
      ? "(no changes)"
      : formValues.maxSlippageBps;
  // eslint-disable-next-line max-len
  const displayCooldown =
    formValues.tradeCooldownSec === undefined ||
    (currentParams?.tradeCooldownSec !== undefined && formValues.tradeCooldownSec === currentParams.tradeCooldownSec)
      ? "(no changes)"
      : formValues.tradeCooldownSec;

  const additions = (formValues.whitelistAdd || []).filter((p) => (p?.tokenA || "").trim() && (p?.tokenB || "").trim());
  const removals = (formValues.whitelistRemove || []).filter(
    (p) => (p?.tokenA || "").trim() && (p?.tokenB || "").trim()
  );

  return (
    <Flex direction="column" gap="1.2rem">
      <Text fontWeight="bold">Review Changes</Text>

      <Box>
        <Text fontWeight="semibold" mb="2">
          Parameters
        </Text>
        {paramsLoading && <Text color="gray.500">Loading current values…</Text>}
        {paramsError && <Text color="red.400">{paramsError}</Text>}
        <Flex direction="column" gap="0.4rem">
          <Text>
            maxTradeBps: {currentParams?.maxTradeBps ?? "?"} → {displayMaxTrade}
          </Text>
          <Text>
            maxSlippageBps: {currentParams?.maxSlippageBps ?? "?"} → {displayMaxSlippage}
          </Text>
          <Text>
            tradeCooldownSec: {currentParams?.tradeCooldownSec ?? "?"} → {displayCooldown}
          </Text>
        </Flex>
      </Box>

      <Box>
        <Text fontWeight="semibold" mb="2">
          Pair whitelist
        </Text>
        {pairsLoading && <Text color="gray.500">Loading current pairs…</Text>}
        {pairsError && <Text color="red.400">{pairsError}</Text>}
        <Box mb="2">
          <Text fontWeight="medium">Current pairs</Text>
          {currentPairs.length === 0 ? (
            <Text color="gray.500">(none)</Text>
          ) : (
            <Flex direction="column" gap="0.4rem">
              {currentPairs.map((p, idx) => (
                // eslint-disable-next-line max-len
                <Text key={`${p.tokenA}-${p.tokenB}-${idx}`}>
                  {shortenAddress(p.tokenA)} — {shortenAddress(p.tokenB)}
                </Text>
              ))}
            </Flex>
          )}
        </Box>
        <Box mb="2">
          <Text fontWeight="medium">To add</Text>
          {additions.length === 0 ? (
            <Text color="gray.500">(no changes)</Text>
          ) : (
            <Flex direction="column" gap="0.4rem">
              {additions.map((p, idx) => (
                // eslint-disable-next-line max-len
                <Text key={`a-${p.tokenA}-${p.tokenB}-${idx}`}>
                  {shortenAddress(p.tokenA)} — {shortenAddress(p.tokenB)}
                </Text>
              ))}
            </Flex>
          )}
        </Box>
        <Box>
          <Text fontWeight="medium">To remove</Text>
          {removals.length === 0 ? (
            <Text color="gray.500">None</Text>
          ) : (
            <Flex direction="column" gap="0.2rem">
              {removals.map((p, idx) => (
                // eslint-disable-next-line max-len
                <Text key={`r-${p.tokenA}-${p.tokenB}-${idx}`}>
                  {shortenAddress(p.tokenA)} — {shortenAddress(p.tokenB)}
                </Text>
              ))}
            </Flex>
          )}
        </Box>
      </Box>
    </Flex>
  );
}
