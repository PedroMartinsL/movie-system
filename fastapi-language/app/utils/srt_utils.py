import re

TIMESTAMP_PATTERN = re.compile(
    r"^\d{2}:\d{2}:\d{2},\d{3}\s-->\s\d{2}:\d{2}:\d{2},\d{3}$"
)


def is_sequence_number_line(line: str) -> bool:
    """
    Verifica se a linha e um numero de sequencia de bloco SRT.
    Exemplo: '1', '2', '3'.
    """
    return line.strip().isdigit()


def is_timestamp_line(line: str) -> bool:
    """
    Verifica se a linha segue o formato de timestamp do SRT.
    Exemplo: '00:00:01,000 --> 00:00:03,000'.
    """
    return bool(TIMESTAMP_PATTERN.match(line.strip()))


def is_empty_line(line: str) -> bool:
    """
    Verifica se a linha esta vazia (ou apenas com espacos).
    """
    return not line.strip()


def is_translatable_text_line(line: str) -> bool:
    """
    Diz se a linha deve ser traduzida.
    Linhas vazias, numeracao e timestamps nao devem ser traduzidos.
    """
    if is_empty_line(line):
        return False
    if is_sequence_number_line(line):
        return False
    if is_timestamp_line(line):
        return False
    return True


def validate_srt_content(content: str) -> None:
    """
    Valida o conteudo basico de um SRT para o MVP:
    - nao pode ser vazio
    - deve conter ao menos uma numeracao e um timestamp
    """
    if not content or not content.strip():
        raise ValueError("subtitle_content cannot be empty.")

    lines = content.splitlines()
    has_sequence = any(is_sequence_number_line(line) for line in lines)
    has_timestamp = any(is_timestamp_line(line) for line in lines)

    if not has_sequence or not has_timestamp:
        raise ValueError("Invalid SRT content. Missing sequence number or timestamp.")
