import { Button } from "../ui/button";

type GoogleButtonProps = {
  onClick: () => void;
};

export function GoogleButton({ onClick }: GoogleButtonProps) {
  return (
    <Button type="button" variant="outline" className="h-9 w-full bg-white" onClick={onClick}>
      <span className="grid h-5 w-5 place-items-center rounded-full border border-slate-200 text-xs font-black text-slate-700">
        G
      </span>
      Continuar con Google
    </Button>
  );
}
