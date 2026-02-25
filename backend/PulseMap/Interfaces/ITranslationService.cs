namespace PulseMap.Interfaces;

public interface ITranslationService
{
    Task<string> TranslateToEnglishIfNeededAsync(string text, CancellationToken ct);
    bool IsEnglish(string text);
}
