import typer
from . import auth, models, run

app = typer.Typer(
    name="omnivax",
    help="""
    🌿 Omnivax CLI: Professional Developer Ecosystem for Plant Disease Intelligence.
    
    This tool allows researchers and developers to authenticate, manage diagnostic models, 
    and run high-speed batch predictions directly from the terminal.
    """,
    add_completion=False,
)

app.add_typer(auth.app, name="auth")
app.add_typer(models.app, name="models")
app.add_typer(run.app, name="run")

@app.callback()
def callback():
    """
    Omnivax CLI - Diagnostic Power in your Terminal.
    
    Use 'omnivax <command> --help' for more information on a specific subcommand.
    """
    pass

if __name__ == "__main__":
    app()
