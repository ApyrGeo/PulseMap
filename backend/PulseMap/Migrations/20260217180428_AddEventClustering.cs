using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PulseMap.Migrations
{
    /// <inheritdoc />
    public partial class AddEventClustering : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<float>(
                name: "EventAssignmentConfidence",
                table: "Locations",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EventId",
                table: "Locations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EmbeddingEventExtractorSuccess",
                table: "AIStatistics",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EventClusteringRuns",
                table: "AIStatistics",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "GptEventExtractorSuccess",
                table: "AIStatistics",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Events",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsAIGenerated = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    RequiresReview = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ConfidenceScore = table.Column<float>(type: "real", nullable: false, defaultValue: 1f),
                    Latitude = table.Column<double>(type: "double precision", nullable: false),
                    Longitude = table.Column<double>(type: "double precision", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsExpired = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Events", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "AIStatistics",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "EmbeddingEventExtractorSuccess", "EventClusteringRuns", "GptEventExtractorSuccess" },
                values: new object[] { 0, 0, 0 });

            migrationBuilder.CreateIndex(
                name: "IX_Locations_EventId",
                table: "Locations",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_Latitude_Longitude",
                table: "Events",
                columns: new[] { "Latitude", "Longitude" });

            migrationBuilder.CreateIndex(
                name: "IX_Events_Name",
                table: "Events",
                column: "Name");

            migrationBuilder.AddForeignKey(
                name: "FK_Locations_Events_EventId",
                table: "Locations",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Locations_Events_EventId",
                table: "Locations");

            migrationBuilder.DropTable(
                name: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Locations_EventId",
                table: "Locations");

            migrationBuilder.DropColumn(
                name: "EventAssignmentConfidence",
                table: "Locations");

            migrationBuilder.DropColumn(
                name: "EventId",
                table: "Locations");

            migrationBuilder.DropColumn(
                name: "EmbeddingEventExtractorSuccess",
                table: "AIStatistics");

            migrationBuilder.DropColumn(
                name: "EventClusteringRuns",
                table: "AIStatistics");

            migrationBuilder.DropColumn(
                name: "GptEventExtractorSuccess",
                table: "AIStatistics");
        }
    }
}
