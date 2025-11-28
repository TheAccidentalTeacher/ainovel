"""Simple CLI helper to convert DOCX manuscripts into plain text for AI review."""

import argparse
from pathlib import Path

from docx import Document


def read_docx(input_path: Path) -> str:
    """Return the document contents joined by newlines."""
    document = Document(input_path)
    paragraphs = [para.text.rstrip() for para in document.paragraphs]
    return "\n".join(paragraphs).strip() + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Extract plain text from a DOCX file so we can hand it to Claude "
            "Sonnet 4.5 or other reviewers without manual copy/paste."
        )
    )
    parser.add_argument(
        "input_path",
        help="Path to the source .docx file (absolute or relative to repo root).",
    )
    parser.add_argument(
        "--out",
        dest="output_path",
        help=(
            "Optional destination file. If omitted, the manuscript is printed to stdout "
            "so it can be piped directly into chat."),
    )
    args = parser.parse_args()

    source = Path(args.input_path).expanduser().resolve()
    if not source.exists():
        raise SystemExit(f"Input file not found: {source}")

    text = read_docx(source)

    if args.output_path:
        destination = Path(args.output_path).expanduser().resolve()
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(text, encoding="utf-8")
        print(f"Wrote {destination} ({len(text.splitlines())} lines)")
    else:
        print(text, end="")


if __name__ == "__main__":
    main()
