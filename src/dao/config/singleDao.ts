import { Routes } from "@dao/routes";
import type { ContractInterface } from "ethers";
import ParameterStore from "./abi/ParameterStore.json";
import PairWhitelist from "./abi/PairWhitelist.json";

// eslint-disable-next-line max-len
export type SingleDAOType =
  | typeof Routes.GovernanceToken
  | typeof Routes.Multisig
  | typeof Routes.NFT
  | typeof Routes.HuffyDAO;

function normalizeDAOType(value?: string): SingleDAOType {
  const v = (value || "").trim().toLowerCase();
  if (v === Routes.Multisig) return Routes.Multisig as SingleDAOType;
  if (v === Routes.NFT) return Routes.NFT as SingleDAOType;
  if (v === Routes.HuffyDAO) return Routes.HuffyDAO as SingleDAOType;
  return Routes.GovernanceToken as SingleDAOType;
}

export const SINGLE_DAO_TYPE: SingleDAOType = normalizeDAOType(import.meta.env.VITE_SINGLE_DAO_TYPE);
export const SINGLE_DAO_ID: string = import.meta.env.VITE_SINGLE_DAO_ID.trim();

const PARAMETER_STORE_CONTRACT_ID: string = import.meta.env.VITE_PARAMETER_STORE_CONTRACT_ID.trim();
const PAIR_WHITELIST_CONTRACT_ID: string = import.meta.env.VITE_PAIR_WHITELIST_CONTRACT_ID.trim();

export const DEFAULT_DAO_OVERVIEW_PATH = `/${SINGLE_DAO_TYPE}/${SINGLE_DAO_ID}/${Routes.Overview}`;

export type DexMinMax = { min?: number; max?: number };
export type DexSettingsConfig = {
  parameterStore?: {
    contractId?: string;
    abi?: ContractInterface;
    methods?: {
      maxTradeBps?: string;
      maxSlippageBps?: string;
      tradeCooldownSec?: string;
      readAll?: string;
    };
    minMax?: {
      maxTradeBps?: DexMinMax;
      maxSlippageBps?: DexMinMax;
      tradeCooldownSec?: DexMinMax;
    };
  };
  pairWhitelist?: {
    contractId?: string;
    abi?: ContractInterface;
    methods?: {
      getPairs?: string;
    };
  };
};

export const SINGLE_DAO_DEX_SETTINGS: DexSettingsConfig = {
  parameterStore: {
    contractId: PARAMETER_STORE_CONTRACT_ID,
    abi: (ParameterStore as any).abi,
    methods: { maxTradeBps: "maxTradeBps", maxSlippageBps: "maxSlippageBps", tradeCooldownSec: "tradeCooldownSec" },
    minMax: {
      maxTradeBps: { min: 0, max: 10000 },
      maxSlippageBps: { min: 0, max: 10000 },
      tradeCooldownSec: { min: 0, max: 604800 },
    },
  },
  pairWhitelist: {
    contractId: PAIR_WHITELIST_CONTRACT_ID,
    abi: (PairWhitelist as any).abi,
    methods: { getPairs: "getAllWhitelistedPairs" },
  },
};
