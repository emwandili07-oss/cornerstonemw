export function formatMWK(n: number | bigint | null | undefined): string {
  if (n == null) return "MWK 0";
  const num = typeof n === "bigint" ? Number(n) : n;
  return "MWK " + new Intl.NumberFormat("en-MW").format(num);
}

export const SUBSCRIPTION_PRICES = {
  landlord_monthly: 20000,
  seeker_weekly: 5000,
  seeker_monthly: 15000,
} as const;

export const CONTACT = {
  email: "nyumbaonlinemw@gmail.com",
  phone1: "+265886396813",
  phone2: "+265990091744",
};

export const DISTRICTS = [
  "Balaka","Blantyre","Chikwawa","Chiradzulu","Chitipa","Dedza","Dowa","Karonga",
  "Kasungu","Likoma","Lilongwe","Machinga","Mangochi","Mchinji","Mulanje","Mwanza",
  "Mzimba","Neno","Nkhata Bay","Nkhotakota","Nsanje","Ntcheu","Ntchisi","Phalombe",
  "Rumphi","Salima","Thyolo","Zomba","Other"
];

export const AMENITIES = [
  "Parking","Security","Borehole Water","Electricity (ESCOM)","Solar Backup",
  "Air Conditioning","Furnished","Garden","Swimming Pool","Wi-Fi","DSTV",
  "Servant Quarters","Garage","Wall Fence","Gated Community","Pet Friendly"
];
