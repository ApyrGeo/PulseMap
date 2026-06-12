using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PulseMap.Migrations
{
    /// <inheritdoc />
    public partial class AddAiStats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AIStatistics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    HuggingFaceClassifierSuccess = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    OpenAIClassifierSuccess = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    KeywordClassifierFallback = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    GptMatcherSuccess = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    EmbeddingMatcherSuccess = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    KeywordMatcherFallback = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    TranslationsPerformed = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    LastUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    TotalClassificationCalls = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    TotalMatchingCalls = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AIStatistics", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "AIStatistics",
                columns: new[] { "Id", "LastUpdated" },
                values: new object[] { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AIStatistics");
        }
    }
}
