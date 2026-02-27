declare module "lucide-react/icons/*" {
  import { FC, SVGProps } from "react";
  const Icon: FC<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;
  export default Icon;
}
