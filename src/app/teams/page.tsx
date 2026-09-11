import { sportsService } from '@/services/sports/service';
import { EntityList } from '@/components/sports/entity-list';
export const metadata = { title: 'Teams' };
export default async function Page() {
  const { data, provenance } = await sportsService.getCatalog();
  return (
    <EntityList
      title="Teams"
      description="Clubs to follow. Crowds to join."
      source={provenance.label}
      items={data.teams.map((entity) => ({
        id: entity.id,
        name: entity.name,
        description:
          data.sports.find((sport) => sport.id === entity.sportId)?.name ??
          'Sport unavailable',
        href: `/teams/${entity.id}`,
        badge: entity.name
          .split(' ')
          .map((word) => word[0])
          .slice(0, 2)
          .join(''),
      }))}
    />
  );
}
