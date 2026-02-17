import { Metadata } from "next";
import ClientSPAMount from "./ClientSPAMount";

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

export default function SPAMount() {
    return <ClientSPAMount />;
}
