import typer
from . import auth, models, run

app = typer.Typer(
    help="Omnivax: Enterprise AI diagnostics for global plant health.",
    no_args_is_help=True
)

app.add_typer(auth.app, name="auth")
app.add_typer(models.app, name="models")
app.add_typer(run.app, name="run")

if __name__ == "__main__":
    app()
