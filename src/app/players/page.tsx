import { sportsService } from '@/services/sports/service';
import { EntityList } from '@/components/sports/entity-list';
export const metadata = { title: 'Players' };
export default async function Page() {
  const { data, provenance } = await sportsService.getCatalog();
  return (
    <EntityList
      title="Players"
      description="Find the players who make the difference."
      source={provenance.label}
      items={data.players.map((entity) => ({
        id: entity.id,
        name: entity.name,
        description:
          data.sports.find((sport) => sport.id === entity.sportId)?.name ??
          'Sport unavailable',
        href: `/players/${entity.id}`,
        badge: entity.name
          .split(' ')
          .map((word) => word[0])
          .slice(0, 2)
          .join(''),
      }))}
    />
  );
}
