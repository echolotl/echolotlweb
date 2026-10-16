{
  description = "Development shell for echolotl.lol";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = { self , nixpkgs ,... }: let
    system = "x86_64-linux";
  in {
    devShells."${system}".default = let
      pkgs = import nixpkgs { inherit system; };
    in pkgs.mkShell {
      packages = with pkgs; [
        nodejs
        pnpm
      ];

      shellHook = ''
        echo "ECHOLOTL.LOL DEV SHELL --"
        echo "  Branch: `git rev-parse --abbrev-ref HEAD`"
        echo "  Commit: $(git rev-parse HEAD | cut -c1-7)"
        echo "  Node:   `node --version`"
        echo "  PNPM:   `pnpm -v`"
        pnpm i -s && echo "PNPM dependencies installed, ready to go!"
      '';
    };
  };
}