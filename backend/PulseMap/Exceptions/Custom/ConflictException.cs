using System.Net;

namespace Backend.Exceptions.Custom;

public class ConflictException(string message) : CustomException(message, HttpStatusCode.Conflict) {}
