import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import FacturaAPIService from '../../services/facturaApi';
import Button from '../common/Button/Button';
import Input from '../common/Input/Input';
import Select from '../common/Select/Select';

const ProductModalForm = ({ open, onClose, onCreated }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catalogs, setCatalogs] = useState({
    ClaveProductServ: [],
    ClaveUnidad: [],
  });
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      code: '',
      name: '',
      price: '',
      clavePS: '',
      unity: '',
      claveUnity: '',
    },
  });

  // Cargar catálogos cuando se abre el modal
  useEffect(() => {
    if (open) {
      fetchCatalogs();
    }
  }, [open]);

  const fetchCatalogs = async () => {
    setLoadingCatalogs(true);
    try {
      const [prodServ, unidad] = await Promise.all([
        FacturaAPIService.getCatalog('ClaveProductServ'),
        FacturaAPIService.getCatalog('ClaveUnidad'),
      ]);
      
      setCatalogs({
        ClaveProductServ: prodServ.data.data || [],
        ClaveUnidad: unidad.data.data || [],
      });
    } catch (err) {
      console.error('Error cargando catálogos:', err);
      alert('Error al cargar los catálogos: ' + (err.message || 'Error desconocido'));
    }
    setLoadingCatalogs(false);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      console.log('🚀 Creando producto con datos:', data);
      
      // Preparar datos para la API según la documentación
      const productData = {
        code: data.code || undefined, // Opcional
        name: data.name, // Requerido
        price: parseFloat(data.price), // Requerido, como número
        clavePS: data.clavePS, // Requerido
        unity: data.unity, // Requerido
        claveUnity: data.claveUnity, // Requerido
      };

      console.log('📤 Datos enviados a la API:', productData);

      const response = await FacturaAPIService.createProduct(productData);
      
      console.log('✅ Producto creado exitosamente:', response.data);
      
      alert(`Producto creado exitosamente: ${response.data.data?.name || data.name}`);
      
      // Limpiar formulario y cerrar modal
      reset();
      onClose();
      
      // Notificar al componente padre para que refresque la lista
      if (onCreated) {
        onCreated();
      }
    } catch (err) {
      console.error('❌ Error creando producto:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error desconocido';
      alert('Error al crear el producto: ' + errorMessage);
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Sincronizar unity cuando se selecciona claveUnity
  const handleClaveUnityChange = (value) => {
    setValue('claveUnity', value);
    
    // Buscar la unidad correspondiente
    const selectedUnidad = catalogs.ClaveUnidad.find(u => u.key === value);
    if (selectedUnidad) {
      setValue('unity', selectedUnidad.name || '');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Crear Nuevo Producto</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Código/SKU - Opcional */}
            <div>
              <Input
                label="Código/SKU (Opcional)"
                placeholder="Ej: K001"
                {...register('code')}
                error={!!errors.code}
                helperText={errors.code?.message}
              />
            </div>

            {/* Nombre - Requerido */}
            <div>
              <Input
                label="Nombre del Producto *"
                placeholder="Ej: Desarrollo de banner para publicidad"
                {...register('name', { required: 'El nombre del producto es requerido' })}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </div>

            {/* Precio - Requerido */}
            <div>
              <Input
                label="Precio (sin IVA) *"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 35.90"
                {...register('price', { 
                  required: 'El precio es requerido',
                  min: { value: 0, message: 'El precio debe ser mayor a 0' }
                })}
                error={!!errors.price}
                helperText={errors.price?.message}
              />
            </div>

            {/* Clave Producto/Servicio - Requerido */}
            <div>
              <Controller
                name="clavePS"
                control={control}
                rules={{ required: 'Debes seleccionar una clave de producto/servicio' }}
                render={({ field, fieldState }) => (
                  <Select
                    label="Clave Producto/Servicio *"
                    options={catalogs.ClaveProductServ.map((opt) => ({
                      value: String(opt.key),
                      label: `${opt.key} - ${opt.name}`,
                    }))}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Selecciona una clave de producto/servicio"
                    isLoading={loadingCatalogs}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </div>

            {/* Clave Unidad - Requerido */}
            <div>
              <Controller
                name="claveUnity"
                control={control}
                rules={{ required: 'Debes seleccionar una clave de unidad' }}
                render={({ field, fieldState }) => (
                  <Select
                    label="Clave Unidad *"
                    options={catalogs.ClaveUnidad.map((opt) => ({
                      value: String(opt.key),
                      label: `${opt.key} - ${opt.name}`,
                    }))}
                    value={field.value || ''}
                    onChange={handleClaveUnityChange}
                    placeholder="Selecciona una clave de unidad"
                    isLoading={loadingCatalogs}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </div>

            {/* Unidad - Se llena automáticamente */}
            <div>
              <Input
                label="Unidad *"
                placeholder="Se llena automáticamente"
                {...register('unity', { required: 'La unidad es requerida' })}
                value={watch('unity') || ''}
                readOnly
                error={!!errors.unity}
                helperText={errors.unity?.message || 'Se llena automáticamente al seleccionar la clave de unidad'}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg"
              >
                {isSubmitting ? 'Creando...' : 'Crear Producto'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductModalForm;
